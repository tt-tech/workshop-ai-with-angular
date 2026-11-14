import { Component, computed, inject, signal } from '@angular/core';
import { SurfaceComponent } from '@a2ui/angular';
import { assistantModels, AssistantStore } from '@atlas/data-access-assistant';
import { PageHeader } from '@atlas/ui';
import { scenarios } from './scenarios';

const keyDocUrl = 'https://github.com/tt-tech/workshop-ai-with-angular/blob/main/docs/generative-ui.md#your-own-api-key';

@Component({
  selector: 'atlas-assistant-page',
  imports: [PageHeader, SurfaceComponent],
  template: `
    <atlas-page-header title="Assistant" subtitle="Ask about your accounts. The answer is drawn from your own data." />
    <form class="card ask" (submit)="send($event)">
      <fieldset class="models">
        <legend class="small muted">Model</legend>
        @for (model of models; track model.id) {
          <label class="small">
            <input type="radio" name="model" [value]="model.id" [checked]="store.model() === model.id" (change)="store.selectModel(model.id)" />
            {{ model.label }}
          </label>
        }
      </fieldset>
      @if (keyLabel(); as keyLabel) {
        <label class="field">
          {{ keyLabel }}
          <span class="field__hint">Optional. Stays on your machine: never stored, never logged. Open source: <a [href]="keyDocUrl" target="_blank" rel="noopener">check how</a>.</span>
          <input #keyInput type="password" name="apiKey" autocomplete="off" spellcheck="false" [value]="store.apiKey()" (input)="store.setApiKey(keyInput.value)" />
        </label>
      }
      <div class="scenarios">
        <span class="small muted">Try</span>
        @for (scenario of scenarios; track scenario.label) {
          <button
            type="button"
            class="button button--quiet small scenario"
            [class.attack]="scenario.attack"
            [class.selected]="selectedScenario() === scenario.label"
            [attr.aria-pressed]="selectedScenario() === scenario.label"
            (click)="pick(scenario.prompt)"
          >
            {{ scenario.label }}
          </button>
        }
      </div>
      <label class="field">
        Your question
        <textarea #promptInput name="prompt" rows="3" [value]="prompt()" (input)="prompt.set(promptInput.value)"></textarea>
      </label>
      <button class="button" type="submit" [disabled]="store.pending() || !prompt().trim()">Send</button>
    </form>
    @if (store.error(); as error) {
      <p class="alert alert--danger" role="alert">{{ error }}</p>
    }
    <div aria-live="polite">
      @if (store.pending()) {
        <p class="muted">Thinking…</p>
      } @else if (store.reply(); as reply) {
        <section class="card answer a2ui-theme">
          <p class="muted">{{ reply.text }}</p>
          <a2ui-v09-surface [surfaceId]="reply.surfaceId" />
        </section>
        @if (reply.trace; as trace) {
          <details class="card server-log" open>
            <summary class="small strong">Server log</summary>
            <ol class="mono small">
              @for (line of trace; track $index) {
                <li [class.blocked]="line.blocked">{{ line.text }}</li>
              }
            </ol>
          </details>
        }
      }
    </div>
  `,
  styles: `
    .ask,
    .answer {
      display: grid;
      gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    .server-log ol {
      margin: var(--space-3) 0 0;
      padding: var(--space-3);
      list-style: none;
      border-radius: var(--radius-m);
      background: var(--color-surface-sunken);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .server-log .blocked {
      color: var(--color-danger);
    }
    .models {
      display: flex;
      gap: var(--space-4);
      border: 0;
      padding: 0;
      margin: 0;
    }
    .scenarios {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }
    .scenario {
      border: 1px solid transparent;
      border-radius: var(--radius-pill);
    }
    .attack {
      color: var(--color-danger);
    }
    .selected {
      border-color: var(--color-brand);
      background: var(--color-brand-soft);
    }
    .attack.selected {
      border-color: var(--color-danger);
      background: var(--color-danger-soft);
    }
  `,
})
export class AssistantPage {
  protected readonly store = inject(AssistantStore);
  protected readonly models = assistantModels;
  protected readonly scenarios = scenarios;
  protected readonly keyDocUrl = keyDocUrl;
  protected readonly prompt = signal('');
  protected readonly selectedScenario = computed(() => scenarios.find((scenario) => scenario.prompt === this.prompt())?.label);
  protected readonly keyLabel = computed(() => assistantModels.find((model) => model.id === this.store.model())?.keyLabel);

  protected pick(prompt: string): void {
    this.prompt.set(prompt);
    this.store.clear();
  }

  protected send(event: Event): void {
    event.preventDefault();
    void this.store.ask(this.prompt().trim());
  }
}
