import { z } from 'zod';
import { UpstreamError } from '../models/upstream-error';
import { type A2uiComponent, messageSchema } from './protocol';

export interface ModelSurface {
  readonly text: string;
  readonly components: readonly A2uiComponent[];
}

const a2uiBlock = /<a2ui>([\s\S]*?)<\/a2ui>/;
const everyA2uiBlock = new RegExp(a2uiBlock.source, 'g');
const codeFence = /^\s*```(?:json)?\s*|\s*```\s*$/g;

export const readModelReply = (reply: string): ModelSurface => {
  const block = a2uiBlock.exec(reply);
  if (!block) throw new UpstreamError('The model answered without any UI.');
  let json: unknown;
  try {
    json = JSON.parse(block[1].replace(codeFence, ''));
  } catch (error) {
    throw new UpstreamError('The model answer could not be read.', { cause: error });
  }
  const parsed = z.array(messageSchema).safeParse(json);
  if (!parsed.success) throw new UpstreamError('The model answer could not be shown.', { cause: parsed.error });
  const components = parsed.data.flatMap((message) =>
    'createSurface' in message ? (message.createSurface.components ?? []) : 'updateComponents' in message ? message.updateComponents.components : [],
  );
  return { text: reply.replace(everyA2uiBlock, '').trim(), components };
};
