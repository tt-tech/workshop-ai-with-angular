import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountsStore, RatesStore } from '@atlas/data-access-banking';
import { MadPipe, PageHeader } from '@atlas/ui';
import { formatLabel } from './label-format';

@Component({
  selector: 'atlas-transfer-receipt',
  imports: [MadPipe, PageHeader, RouterLink],
  template: `
    @let t = tx();
    @if (t) {
      <atlas-page-header title="Transfer sent" [subtitle]="t.date">
        <a
          class="button button--ghost"
          [routerLink]="['/accounts', t.accountId]"
          >Back to account</a
        >
      </atlas-page-header>
      <section class="receipt card">
        <p class="done">
          <span class="check" aria-hidden="true">✓</span> Money is on its way
        </p>
        <dl>
          <dt>Amount</dt>
          <dd class="amount">
            {{ -t.amountMad | mad }}
            @if (eur(); as e) {
              <span class="muted">≈ {{ e }} EUR</span>
            }
          </dd>
          <dt>Label</dt>
          <dd class="label">
            @for (s of label(); track $index) {
              @if (s.bold) {
                <b>{{ s.text }}</b>
              } @else {
                {{ s.text }}
              }
            }
          </dd>
          <dt>Reference</dt>
          <dd class="mono">{{ t.id }}</dd>
        </dl>
        <button class="button button--ghost" type="button" (click)="share()">
          Copy receipt
        </button>
      </section>
    } @else {
      <p class="muted">Receipt not found.</p>
    }
  `,
  styles: `
    .receipt {
      max-width: 34rem;
    }
    .done {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      font-weight: var(--weight-medium);
      color: var(--color-brand-text);
    }
    .check {
      display: inline-grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--color-brand-soft);
    }
    dl {
      display: grid;
      grid-template-columns: 7rem 1fr;
      row-gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    dt {
      color: var(--color-text-muted);
      font-size: var(--text-s);
    }
    .amount {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    .amount .muted {
      font-size: var(--text-s);
      font-weight: var(--weight-regular);
    }
  `,
})
export class TransferReceipt implements OnInit {
  readonly txId = input.required<string>();

  private readonly store = inject(AccountsStore);
  private readonly rates = inject(RatesStore);

  protected readonly tx = computed(() =>
    this.store.transactionById(this.txId())(),
  );
  protected readonly label = computed(() =>
    formatLabel(this.tx()?.label ?? ''),
  );

  protected readonly eur = computed(() => {
    const rate = this.rates.eurPerMad();
    const t = this.tx();
    return rate && t ? (-t.amountMad * rate).toFixed(2) : undefined;
  });

  ngOnInit(): void {
    void this.store.load();
    void this.rates.load();
  }

  share(): void {
    const t = this.tx();
    if (t)
      void navigator.clipboard.writeText(
        `Atlas Bank transfer ${t.id}: ${-t.amountMad} MAD — ${t.label}`,
      );
  }
}
