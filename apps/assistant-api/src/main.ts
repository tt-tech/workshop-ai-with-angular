import { randomUUID } from 'node:crypto';
import type { AssistantDeps } from './assistant/assistant';
import { demoSession } from './bank';
import { createAssistantServer } from './http/server';

const defaultPort = 3333;
const port = Number(process.env['ATLAS_API_PORT'] ?? defaultPort);

const deps: AssistantDeps = {
  session: demoSession,
  nextSurfaceId: () => `atlas-${randomUUID()}`,
  log: (detail) => console.warn(`   ${detail}`),
  trace: (line) => console.warn(line),
  showTrace: process.env['ATLAS_SHOW_TRACE'] === '1',
};

createAssistantServer(process.env, deps).listen(port, '127.0.0.1', () =>
  console.warn(`assistant-api listening on http://127.0.0.1:${port} (model: ${process.env['ATLAS_MODEL'] ?? 'per request'})`),
);
