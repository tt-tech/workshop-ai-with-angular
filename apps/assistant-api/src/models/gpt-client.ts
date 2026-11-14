import OpenAI from 'openai';
import { type Env, maxOutputTokens, maxRetries, type ModelClient, type ModelRequest, requestTimeoutMs, required } from './model-client';

export class GptClient implements ModelClient {
  constructor(private readonly env: Env) {}

  async complete({ system, prompt }: ModelRequest): Promise<string> {
    const client = new OpenAI({ apiKey: required(this.env, 'OPENAI_API_KEY'), timeout: requestTimeoutMs, maxRetries });
    const response = await client.responses.create({
      model: required(this.env, 'ATLAS_GPT_MODEL'),
      instructions: system,
      input: prompt,
      max_output_tokens: maxOutputTokens,
    });
    if (response.status === 'incomplete') throw new Error(`GPT answer incomplete: ${response.incomplete_details?.reason ?? 'unknown reason'}.`);
    return response.output_text;
  }
}
