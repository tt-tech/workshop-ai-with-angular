import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatRib, packageById } from '@atlas/domain';
import { AccountsStore } from '@atlas/data-access-banking';
import { MadPipe, PageHeader, StatusBadge } from '@atlas/ui';

@Component({
  selector: 'atlas-account-list',
  imports: [RouterLink, MadPipe, PageHeader, StatusBadge],
  template: `
    <atlas-page-header title="Accounts" [subtitle]="store.accounts().length + ' accounts · ' + (store.totalBalanceMad() | mad) + ' in total'" />

    @if (store.loading()) {
      <p class="muted">Loading accounts…</p>
    } @else {
      <table class="table">
        <thead>
          <tr><th>Account</th><th>RIB</th><th>Package</th><th>Status</th><th class="num">Balance</th></tr>
        </thead>
        <tbody>
          @for (a of store.accounts(); track a.id) {
            <tr>
              <td><a [routerLink]="[a.id]" class="strong">{{ a.label }}</a><div class="muted small">{{ a.type }} · since {{ a.openedOn }}</div></td>
              <td class="mono">{{ formatRib(a.rib) }}</td>
              <td>{{ packageById(a.packageId).name }}</td>
              <td><atlas-status-badge [status]="a.status" /></td>
              <td class="num">{{ a.balanceMad | mad }}</td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="muted">You have no accounts yet. Open one from the Requests page.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .mono { font-family: var(--mono); font-size: 0.8125rem; }
    .strong { font-weight: 500; }
    .muted { color: var(--ink-2); }
    .small { font-size: 0.8125rem; }
  `,
})
export class AccountList implements OnInit {
  protected readonly store = inject(AccountsStore);
  protected readonly formatRib = formatRib;
  protected readonly packageById = packageById;

  ngOnInit(): void {
    void this.store.load();
  }
}
