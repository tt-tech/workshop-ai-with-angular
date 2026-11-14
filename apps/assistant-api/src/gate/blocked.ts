import { assistantComponents } from '@atlas/domain';
import { z } from 'zod';
import { type A2uiComponent, rootId } from '../a2ui/protocol';
import { AccessDenied } from '../bank';
import { isMacro } from './macro-registry';

export const blockedNotice = assistantComponents.blockedNotice;

const partFailed = 'This part could not be shown.';
const answerFailed = 'This answer could not be shown.';
const foreignAccount = 'That account is not one of yours.';
const amountsOnlyFromBank = 'Only the bank may show amounts.';
const notAllowed = 'Images, links and other components are not allowed here.';

const notice = (id: string, text: string): A2uiComponent[] => [{ id, component: blockedNotice, text }];

const breaksFigureRule = (error: unknown) => error instanceof z.ZodError && error.issues.some((issue) => issue.code === 'custom' && issue.params?.['figure'] === true);

export const blockedPart = (node: A2uiComponent, error: unknown): A2uiComponent[] => {
  if (error instanceof AccessDenied) return notice(node.id, foreignAccount);
  if (isMacro(node.component)) return notice(node.id, partFailed);
  if (breaksFigureRule(error)) return notice(node.id, amountsOnlyFromBank);
  return notice(node.id, notAllowed);
};

export const blockedAnswer = (): A2uiComponent[] => notice(rootId, answerFailed);

const urlPattern = /[a-z][a-z0-9+.-]*:\/\/[^"\s\\]+/gi;

export const urlsIn = (node: A2uiComponent) => JSON.stringify(node).match(urlPattern) ?? [];

export const reason = (error: unknown) =>
  error instanceof z.ZodError
    ? error.issues.map((issue) => `${issue.path.join('.') || 'arguments'}: ${issue.message}`).join('; ')
    : error instanceof Error
      ? error.message
      : String(error);
