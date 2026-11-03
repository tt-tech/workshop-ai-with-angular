import { Component, input } from '@angular/core';

@Component({
  selector: 'atlas-page-header',
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
    .header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }
    .title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--weight-semibold);
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: var(--space-1) 0 0;
      color: var(--color-text-muted);
      font-variant-numeric: tabular-nums;
    }
    .actions {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
