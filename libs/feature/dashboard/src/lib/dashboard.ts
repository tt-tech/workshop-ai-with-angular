import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryLabel, maskRib } from '@atlas/domain';
import { AccountsStore, CardsStore, RequestsStore } from '@atlas/data-access-banking';
import { Amount, MadPipe, StatusBadge } from '@atlas/ui';

const recentCount = 6;
const customerFirstName = 'Salma';

@Component({
  selector: 'atlas-dashboard',
  imports: [RouterLink, Amount, MadPipe, StatusBadge],
  template: `
    <section class="hero">
      <p class="greeting">{{ greeting() }}, {{ firstName }}.</p>
      <p class="total">{{ accounts.totalBalanceMad() | mad }}</p>
      <p class="figures">
        <span><strong>{{ spentThisMonth() | mad }}</strong> spent this month</span>
        <span><strong>{{ requests.openCount() }}</strong> open requests</span>
        <span><strong>{{ cards.activeCount() }}</strong> active card{{ cards.activeCount() === 1 ? '' : 's' }}</span>
      </p>
    </section>

    <div class="columns">
      <section>
        <h2 class="section-title">Recent activity</h2>
        @if (accounts.loading()) {
          <p class="muted">Loading your accounts…</p>
        } @else {
          <table class="table">
            <tbody>
              @for (t of recent(); track t.id) {
                <tr>
                  <td class="date">{{ t.date }}</td>
                  <td>
                    <div>{{ t.label }}</div>
                    <div class="muted small">{{ categoryLabel[t.category] }} · {{ accountLabel(t.accountId) }}</div>
                  </td>
                  <td class="num"><atlas-amount [value]="t.amountMad" /></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <aside>
        <h2 class="section-title">Accounts</h2>
        <ul class="accounts">
          @for (a of accounts.accounts(); track a.id) {
            <li>
              <a [routerLink]="['/accounts', a.id]">
                <span class="label">{{ a.label }}</span>
                <span class="rib">{{ maskRib(a.rib) }}</span>
                <span class="balance">{{ a.balanceMad | mad }}</span>
                @if (a.status !== 'active') {
                  <atlas-status-badge [status]="a.status" />
                }
              </a>
            </li>
          }
        </ul>
      </aside>
    </div>
  `,
  styles: `
    .hero { padding: 0.5rem 0 2rem; border-bottom: 1px solid var(--line); margin-bottom: 2rem; }
    .greeting { margin: 0; color: var(--ink-2); }
    .total { margin: 0.25rem 0 0.75rem; font-size: 2.75rem; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
    .figures { margin: 0; display: flex; gap: 2rem; color: var(--ink-2); }
    .figures strong { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
    .columns { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 3rem; }
    .section-title { margin: 0 0 1rem; font-size: 0.9375rem; font-weight: 600; color: var(--ink-2); }
    .date { color: var(--ink-2); white-space: nowrap; width: 7rem; }
    .num { text-align: right; }
    .accounts { list-style: none; margin: 0; padding: 0; }
    .accounts li + li { border-top: 1px solid var(--line); }
    .accounts a { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; column-gap: 1rem; padding: 0.9rem 0; text-decoration: none; color: inherit; }
    .accounts a:hover .label { color: var(--petrol); }
    .label { font-weight: 500; }
    .rib { font-family: var(--mono); font-size: 0.8125rem; color: var(--ink-2); }
    .balance { grid-column: 2; grid-row: 1; text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    .accounts atlas-status-badge { grid-column: 2; grid-row: 2; justify-self: end; }
    .muted { color: var(--ink-2); }
    .small { font-size: 0.8125rem; }
    @media (max-width: 900px) { .columns { grid-template-columns: 1fr; gap: 2rem; } .figures { flex-wrap: wrap; gap: 1rem; } }
  `,
})
export class Dashboard implements OnInit {
  protected readonly accounts = inject(AccountsStore);
  protected readonly cards = inject(CardsStore);
  protected readonly requests = inject(RequestsStore);

  protected readonly firstName = customerFirstName;
  protected readonly categoryLabel = categoryLabel;
  protected readonly maskRib = maskRib;

  protected readonly recent = computed(() => this.accounts.recentTransactions().slice(0, recentCount));

  protected readonly spentThisMonth = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    return this.accounts
      .transactions()
      .filter((t) => t.date.startsWith(month) && t.amountMad < 0)
      .reduce((sum, t) => sum - t.amountMad, 0);
  });

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  });

  protected accountLabel(accountId: string): string {
    return this.accounts.accounts().find((a) => a.id === accountId)?.label ?? accountId;
  }

  ngOnInit(): void {
    void this.accounts.load();
    void this.cards.load();
    void this.requests.load();
  }
}
