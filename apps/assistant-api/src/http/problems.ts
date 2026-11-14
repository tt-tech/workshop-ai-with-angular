import { z } from 'zod';
import { UpstreamError } from '../models/upstream-error';
import { TooLarge } from './read-json';
import type { Problem } from './request-guard';

export const problemOf = (error: unknown): Problem => {
  if (error instanceof TooLarge) return { status: 413, error: 'Request too large.' };
  if (error instanceof z.ZodError || error instanceof SyntaxError) return { status: 400, error: 'Invalid request.' };
  if (error instanceof UpstreamError) return { status: 502, error: error.message };
  return { status: 500, error: 'Request failed.' };
};

export const describeFailure = (error: unknown): string => {
  const lines: string[] = [];
  for (let current = error; current !== undefined; current = current instanceof Error ? current.cause : undefined) {
    lines.push(current instanceof Error ? `${current.name}: ${current.message}` : String(current));
  }
  return `assistant-api: request failed: ${lines.join(' <- caused by ')}`;
};
