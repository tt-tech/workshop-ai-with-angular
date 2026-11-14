import Anthropic from '@anthropic-ai/sdk';
import { type Env, maxOutputTokens, maxRetries, type ModelClient, type ModelRequest, requestTimeoutMs, required } from './model-client';

const defaultClaudeModel = 'claude-sonnet-5-5';

export class ClaudeClient implements ModelClient {
  constructor(private readonly env: Env) {}

  async complete({ system, prompt }: ModelRequest): Promise<string> {
    const client = new Anthropic({ apiKey: required(this.env, 'ANTHROPIC_API_KEY'), timeout: requestTimeoutMs, maxRetries });
    const response = await client.beta.messages.create({
      model: this.env['ATLAS_CLAUDE_MODEL'] ?? defaultClaudeModel,
      max_tokens: maxOutputTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    if (response.stop_reason === 'refusal') throw new Error('Claude declined this request.');
    if (response.stop_reason === 'max_tokens') throw new Error(`Claude stopped at max_tokens (${maxOutputTokens}).`);
    return response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('\n');
  }
}
