import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MadPipe } from './mad.pipe';

@Component({
  selector: 'atlas-amount',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MadPipe],
  template: `<span class="amount" [class.amount--credit]="isCredit()" [class.amount--debit]="!isCredit()">{{ signed() | mad }}</span>`,
  styles: `
    .amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .amount--credit { color: var(--green); }
    .amount--debit { color: var(--ink); }
  `,
})
export class Amount {
  readonly value = input.required<number>();
  /** When true, positive values are shown with an explicit + (transactions); balances leave it off. */
  readonly signed = computed(() => this.value());
  readonly isCredit = computed(() => this.value() > 0);
}
