import { Component, computed } from '@angular/core';
import { CatalogComponent, createComponentImplementation } from '@a2ui/angular';
import { type ComponentApi, DynamicStringSchema, DynamicValueSchema } from '@a2ui/web_core/v1_0';
import { assistantComponents, type SpendingBar } from '@atlas/domain';
import { MadPipe } from '@atlas/ui';
import { z } from 'zod';
import { spendingBarsOf, stringOf } from './bound-value';

const spendingChartApi = {
  name: assistantComponents.spendingChart,
  schema: z.object({ month: DynamicStringSchema, bars: DynamicValueSchema }).strict(),
} satisfies ComponentApi;

const fullWidthPercent = 100;

const withShare = (bars: readonly SpendingBar[]) => {
  const largest = Math.max(...bars.map((bar) => bar.amountMad));
  return bars.map((bar) => ({ ...bar, percent: (bar.amountMad / largest) * fullWidthPercent }));
};

@Component({
  selector: 'atlas-spending-chart',
  imports: [MadPipe],
  template: `
    <figure class="chart">
      <figcaption class="strong">Spending in {{ month() }}</figcaption>
      @for (bar of bars(); track bar.label) {
        <div class="row">
          <span class="small">{{ bar.label }}</span>
          <span class="track"><span class="bar" [style.width.%]="bar.percent"></span></span>
          <span class="num small amount">{{ bar.amountMad | mad }}</span>
        </div>
      }
    </figure>
  `,
  styles: `
    .chart {
      display: grid;
      gap: var(--space-2);
      margin: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 7rem 1fr 7.5rem;
      align-items: center;
      gap: var(--space-3);
    }
    .amount {
      text-align: end;
    }
    .track {
      height: var(--space-2);
      border-radius: var(--radius-m);
      background: var(--color-surface-sunken);
    }
    .bar {
      display: block;
      height: 100%;
      border-radius: var(--radius-m);
      background: var(--color-brand);
    }
  `,
})
export class SpendingChart extends CatalogComponent<typeof spendingChartApi> {
  protected readonly month = computed(() => stringOf(this.props().month?.value()) ?? '');
  protected readonly bars = computed(() => withShare(spendingBarsOf(this.props().bars?.value())));
}

export const spendingChartImplementation = createComponentImplementation(spendingChartApi, SpendingChart);
