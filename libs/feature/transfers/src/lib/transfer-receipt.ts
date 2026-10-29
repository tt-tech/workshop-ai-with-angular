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
        <a class="button button--ghost" [routerLink]="['/accounts', t.accountId]">Back to account</a>
      </atlas-page-header>
      <dl class="receipt">
        <dt>Amount</dt>
        <dd class="amount">{{ -t.amountMad | mad }} @if (eur(); as e) { <span class="muted">≈ {{ e }} EUR</span> }</dd>
        <dt>Label</dt>
        <dd class="label">
          @for (s of label(); track $index) {
            @if (s.bold) { <b>{{ s.text }}</b> } @else { {{ s.text }} }
          }
        </dd>
        <dt>Reference</dt>
        <dd class="mono">{{ t.id }}</dd>
      </dl>
      <button class="button" type="button" (click)="share()">Copy receipt</button>
    } @else {
      <p class="muted">Receipt not found.</p>
    }
  `,
  styles: `
    .receipt { display: grid; grid-template-columns: 7rem 1fr; row-gap: 0.75rem; max-width: 34rem; margin: 0 0 1.5rem; }
    dt { color: var(--ink-2); }
    dd { margin: 0; }
    .amount { font-size: 1.25rem; font-weight: 600; }
    .mono { font-family: var(--mono); font-size: 0.8125rem; }
    .muted { color: var(--ink-2); font-weight: 400; font-size: 0.875rem; }
  `,
})
export class TransferReceipt implements OnInit {
  readonly txId = input.required<string>();

  private readonly store = inject(AccountsStore);
  private readonly rates = inject(RatesStore);

  protected readonly tx = computed(() => this.store.transactionById(this.txId())());
  protected readonly label = computed(() => formatLabel(this.tx()?.label ?? ''));

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
    if (t) void navigator.clipboard.writeText(`Atlas Bank transfer ${t.id}: ${-t.amountMad} MAD — ${t.label}`);
  }
}
