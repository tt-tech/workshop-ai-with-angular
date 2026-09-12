import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'atlas-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div>
        <h1 class="title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; padding-bottom: 1.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--line); }
    .title { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.01em; }
    .subtitle { margin: 0.25rem 0 0; color: var(--ink-2); }
    .actions { display: flex; gap: 0.5rem; align-items: center; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
