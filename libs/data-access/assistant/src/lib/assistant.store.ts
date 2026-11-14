import { computed, inject, Injectable, PendingTasks, signal } from '@angular/core';
import { A2uiRendererService } from '@a2ui/angular';
import { type AssistantAction, AssistantBackend, type AssistantModel, type AssistantReply } from './assistant.backend';

@Injectable()
export class AssistantStore {
  private readonly backend = inject(AssistantBackend);
  private readonly renderer = inject(A2uiRendererService);
  private readonly pendingTasks = inject(PendingTasks);

  private readonly replyState = signal<AssistantReply | undefined>(undefined);
  private readonly modelState = signal<AssistantModel>('claude');
  private readonly apiKeysState = signal<Partial<Record<AssistantModel, string>>>({});
  private readonly pendingState = signal(false);
  private readonly errorState = signal<string | undefined>(undefined);

  readonly reply = this.replyState.asReadonly();
  readonly model = this.modelState.asReadonly();
  readonly pending = this.pendingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly apiKey = computed(() => this.apiKeysState()[this.modelState()] ?? '');

  selectModel(model: AssistantModel): void {
    this.modelState.set(model);
  }

  setApiKey(apiKey: string): void {
    const model = this.modelState();
    this.apiKeysState.update((keys) => ({ ...keys, [model]: apiKey }));
  }

  clear(): void {
    this.replyState.set(undefined);
    this.errorState.set(undefined);
  }

  ask(prompt: string): Promise<void> {
    return this.record(this.backend.ask(prompt, this.modelState(), this.apiKey().trim() || undefined));
  }

  act(action: AssistantAction): Promise<void> {
    return this.record(this.backend.act(action));
  }

  private async record(reply: Promise<AssistantReply>): Promise<void> {
    const done = this.pendingTasks.add();
    this.clear();
    this.pendingState.set(true);
    try {
      const answer = await reply;
      await this.renderer.processMessagesAsync([...answer.messages]);
      this.replyState.set(answer);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.pendingState.set(false);
      done();
    }
  }
}
