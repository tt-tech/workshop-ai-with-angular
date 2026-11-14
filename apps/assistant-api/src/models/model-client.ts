export const modelChoices = ['claude', 'gpt', 'compromised'] as const;
export type ModelChoice = (typeof modelChoices)[number];

export interface ModelRequest {
  readonly system: string;
  readonly prompt: string;
}

export interface ModelClient {
  complete(request: ModelRequest): Promise<string>;
}

export type Env = Readonly<Record<string, string | undefined>>;

export const maxOutputTokens = 4000;
export const requestTimeoutMs = 30_000;
export const maxRetries = 1;

export const required = (env: Env, name: string): string => {
  const value = env[name];
  if (!value) throw new Error(`${name} is not set. See docs/generative-ui.md.`);
  return value;
};
