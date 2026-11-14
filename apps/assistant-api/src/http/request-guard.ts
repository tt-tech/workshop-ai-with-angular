import type { IncomingHttpHeaders } from 'node:http';

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

export interface Problem {
  readonly status: number;
  readonly error: string;
}

const hostnameOf = (host: string | undefined) => {
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return undefined;
  }
};

export const requestProblem = (headers: IncomingHttpHeaders): Problem | undefined => {
  if (!loopbackHosts.has(hostnameOf(headers.host) ?? '')) return { status: 403, error: 'Forbidden host.' };
  if (!headers['content-type']?.startsWith('application/json')) return { status: 415, error: 'Send application/json.' };
  return undefined;
};
