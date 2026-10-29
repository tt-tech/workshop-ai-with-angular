import { Component, computed, inject, input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AccountsStore } from '@atlas/data-access-banking';
import { MadPipe, PageHeader } from '@atlas/ui';
import { FxService } from './fx.service';

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
        <dd [innerHTML]="labelHtml()"></dd>
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
  private readonly fx = inject(FxService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly tx = computed(() => this.store.transactionById(this.txId())());

  protected readonly eur = computed(() => {
    const rate = this.fx.eurPerMad();
    const t = this.tx();
    return rate && t ? (-t.amountMad * rate).toFixed(2) : undefined;
  });

  // Renders **bold** from the label the customer typed
  protected readonly labelHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml((this.tx()?.label ?? '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')));

  ngOnInit(): void {
    void this.store.load();
    void this.fx.load();
  }

  share(): void {
    const t = this.tx();
    if (t) void navigator.clipboard.writeText(`Atlas Bank transfer ${t.id}: ${-t.amountMad} MAD — ${t.label}`);
  }
}
