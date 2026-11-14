import { z } from 'zod';
import { type A2uiComponent, rootId } from '../a2ui/protocol';
import { readModelReply } from '../a2ui/read-model-reply';
import { surfaceMessages } from '../a2ui/surface-messages';
import type { Session } from '../bank';
import { type GatedSurface, passGate } from '../gate/gate';
import type { MacroName } from '../gate/macro-registry';
import { hasFigure, showTransactionsEvent } from '../gate/model-components';
import type { Log } from '../log';
import { type ModelChoice, modelChoices, type ModelClient } from '../models/model-client';
import { UpstreamError } from '../models/upstream-error';
import { systemPrompt } from './system-prompt';
import { acted, asked, placed, type RequestTrace, requestTrace, verdict } from './trace';

const maxPromptLength = 2000;
const recentLimit = 5;
const neutralText = 'Here is your answer.';
const recentTransactions: MacroName = 'RecentTransactions';

const maxApiKeyLength = 300;

const askSchema = z.object({
  prompt: z.string().trim().min(1).max(maxPromptLength),
  model: z.enum(modelChoices),
  apiKey: z.string().trim().min(1).max(maxApiKeyLength).optional(),
});
const actionSchema = showTransactionsEvent.strip();

export interface AssistantDeps {
  readonly session: Session;
  readonly nextSurfaceId: () => string;
  readonly log: Log;
  readonly trace: Log;
  readonly showTrace: boolean;
}

export type ClientFor = (model: ModelChoice, apiKey: string | undefined) => ModelClient;

const reply = (text: string, surfaceId: string, surface: GatedSurface, trace: RequestTrace, deps: AssistantDeps) => ({
  text,
  surfaceId,
  messages: surfaceMessages(surfaceId, surface.components, surface.data),
  trace: deps.showTrace ? trace.lines : undefined,
});

export const ask = async (raw: unknown, clientFor: ClientFor, deps: AssistantDeps) => {
  const body = askSchema.parse(raw);
  const startedAt = Date.now();
  const trace = requestTrace(deps.trace, deps.log);
  trace.step(asked(body.model, body.prompt));
  const answer = await clientFor(body.model, body.apiKey)
    .complete({ system: systemPrompt(deps.session), prompt: body.prompt })
    .catch((error: unknown) => {
      throw new UpstreamError('The model could not answer. See the assistant-api log.', { cause: error });
    });
  const modelReply = readModelReply(answer);
  trace.step(placed(modelReply.components));
  const surface = passGate(modelReply.components, deps.session, trace.blocked);
  trace.step(verdict(surface.components, startedAt));
  return reply(hasFigure(modelReply.text) ? neutralText : modelReply.text, deps.nextSurfaceId(), surface, trace, deps);
};

export const act = (raw: unknown, deps: AssistantDeps) => {
  const action = actionSchema.parse(raw);
  const startedAt = Date.now();
  const trace = requestTrace(deps.trace, deps.log);
  trace.step(acted(action.name, action.context.accountId));
  const node: A2uiComponent = { id: rootId, component: recentTransactions, accountId: action.context.accountId, limit: recentLimit };
  const surface = passGate([node], deps.session, trace.blocked);
  trace.step(verdict(surface.components, startedAt));
  return reply('Your recent transactions.', deps.nextSurfaceId(), surface, trace, deps);
};
