import { createServer, type ServerResponse } from 'node:http';
import { act, ask, type AssistantDeps } from '../assistant/assistant';
import type { Env } from '../models/model-client';
import { modelClientFor } from '../models/model-for';
import { describeFailure, problemOf } from './problems';
import { readJson } from './read-json';
import { requestProblem } from './request-guard';

const requestTimeoutMs = 10_000;

const send = (res: ServerResponse, status: number, payload: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(payload));
};

export const createAssistantServer = (env: Env, deps: AssistantDeps) => {
  const routes: Record<string, (body: unknown) => unknown> = {
    '/api/assistant': (body) => ask(body, (model, apiKey) => modelClientFor(model, env, apiKey), deps),
    '/api/assistant/action': (body) => act(body, deps),
  };
  const server = createServer(async (req, res) => {
    const route = req.method === 'POST' && Object.hasOwn(routes, req.url ?? '') ? routes[req.url ?? ''] : undefined;
    if (!route) return send(res, 404, { error: 'Not found.' });
    const problem = requestProblem(req.headers);
    if (problem) return send(res, problem.status, { error: problem.error });
    try {
      send(res, 200, await route(await readJson(req)));
    } catch (error) {
      deps.log(describeFailure(error));
      const failure = problemOf(error);
      send(res, failure.status, { error: failure.error });
    }
  });
  server.requestTimeout = requestTimeoutMs;
  return server;
};
