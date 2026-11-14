import { ClaudeClient } from './claude-client';
import { GptClient } from './gpt-client';
import type { Env, ModelChoice, ModelClient } from './model-client';
import { ScriptedModelClient } from './scripted-model-client';

const withKey = (env: Env, name: string, apiKey: string | undefined): Env => (apiKey ? { ...env, [name]: apiKey } : env);

const clients: Record<ModelChoice, (env: Env, apiKey: string | undefined) => ModelClient> = {
  claude: (env, apiKey) => new ClaudeClient(withKey(env, 'ANTHROPIC_API_KEY', apiKey)),
  gpt: (env, apiKey) => new GptClient(withKey(env, 'OPENAI_API_KEY', apiKey)),
  compromised: () => new ScriptedModelClient(),
};

export const modelClientFor = (choice: ModelChoice, env: Env, apiKey?: string): ModelClient => {
  if (env['ATLAS_MODEL'] === 'fake') return new ScriptedModelClient();
  return clients[choice](env, apiKey);
};
