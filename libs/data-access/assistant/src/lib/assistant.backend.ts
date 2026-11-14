import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ServerTraceLine } from '@atlas/domain';
import { firstValueFrom } from 'rxjs';

export const assistantModels = [
  { id: 'claude', label: 'Claude', keyLabel: 'Anthropic API key' },
  { id: 'gpt', label: 'GPT', keyLabel: 'OpenAI API key' },
  { id: 'compromised', label: 'Compromised model (simulated)', keyLabel: undefined },
] as const;

export type AssistantModel = (typeof assistantModels)[number]['id'];

export interface AssistantReply {
  readonly text: string;
  readonly surfaceId: string;
  readonly messages: readonly unknown[];
  readonly trace?: readonly ServerTraceLine[];
}

export interface AssistantAction {
  readonly name: string;
  readonly surfaceId: string;
  readonly sourceComponentId: string;
  readonly context: Readonly<Record<string, unknown>>;
}

const askUrl = '/api/assistant';
const actionUrl = '/api/assistant/action';

const messageOf = (error: HttpErrorResponse) => (typeof error.error?.error === 'string' ? error.error.error : `The assistant answered ${error.status}.`);

@Injectable({ providedIn: 'root' })
export class AssistantBackend {
  private readonly http = inject(HttpClient);

  ask(prompt: string, model: AssistantModel, apiKey: string | undefined): Promise<AssistantReply> {
    return this.post(askUrl, { prompt, model, apiKey });
  }

  act(action: AssistantAction): Promise<AssistantReply> {
    return this.post(actionUrl, action);
  }

  private async post(url: string, body: object): Promise<AssistantReply> {
    try {
      return await firstValueFrom(this.http.post<AssistantReply>(url, body));
    } catch (error) {
      throw error instanceof HttpErrorResponse ? new Error(messageOf(error)) : error;
    }
  }
}
