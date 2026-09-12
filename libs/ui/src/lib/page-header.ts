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
    .header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    .title { margin: 0; font-size: 1.6rem; }
    .subtitle { margin: 0.25rem 0 0; color: #5a6270; }
    .actions { display: flex; gap: 0.5rem; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
