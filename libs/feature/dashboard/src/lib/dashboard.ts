import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryLabel, maskRib } from '@atlas/domain';
import {
  AccountsStore,
  CardsStore,
  RequestsStore,
} from '@atlas/data-access-banking';
import { Amount, MadPipe, StatusBadge } from '@atlas/ui';

const recentCount = 6;
const customerFirstName = 'Salma';

@Component({
  selector: 'atlas-dashboard',
  imports: [RouterLink, Amount, MadPipe, StatusBadge],
  template: `
    <section class="hero" aria-labelledby="total-label">
      <p class="greeting">{{ greeting() }}, {{ firstName }}.</p>
      <p class="total-label" id="total-label">Total balance</p>
      @if (ready()) {
        <p class="total">{{ accounts.totalBalanceMad() | mad }}</p>
        <ul class="figures">
          <li>
            <strong>{{ spentThisMonth() | mad }}</strong> spent this month
          </li>
          <li>
            <strong>{{ requests.openCount() }}</strong> open requests
          </li>
          <li>
            <strong>{{ cards.activeCount() }}</strong> active card{{
              cards.activeCount() === 1 ? '' : 's'
            }}
          </li>
        </ul>
        @if (payFrom(); as from) {
          <a class="send" [routerLink]="['/transfers/new', from.id]"
            >Send money</a
          >
        }
      } @else {
        <p class="total pending" aria-busy="true">Loading balance…</p>
      }
    </section>

    <div class="columns">
      <section class="card card--flush">
        <header class="card__header">
          <h2 class="card__title">Recent activity</h2>
        </header>
        @if (accounts.loading()) {
          <p class="muted pad">Loading your accounts…</p>
        } @else {
          <table class="table">
            <tbody>
              @for (t of recent(); track t.id) {
                <tr>
                  <td class="date muted small">{{ t.date }}</td>
                  <td>
                    <div class="strong">{{ t.label }}</div>
                    <div class="muted small">
                      {{ categoryLabel[t.category] }} ·
                      {{ accountLabel(t.accountId) }}
                    </div>
                  </td>
                  <td class="num"><atlas-amount [value]="t.amountMad" /></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>

      <aside class="card card--flush">
        <header class="card__header">
          <h2 class="card__title">Accounts</h2>
        </header>
        <ul class="accounts">
          @for (a of accounts.accounts(); track a.id) {
            <li>
              <a [routerLink]="['/accounts', a.id]">
                <span class="label">{{ a.label }}</span>
                <span class="rib mono muted">{{ maskRib(a.rib) }}</span>
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
    .hero {
      margin-bottom: var(--space-8);
      padding: var(--space-8);
      border-radius: var(--radius-l);
      background: linear-gradient(
        135deg,
        var(--color-hero-from),
        var(--color-hero-to)
      );
      color: var(--color-rail-text);
      box-shadow: var(--shadow-2);
    }
    .greeting {
      font-size: var(--text-l);
      font-weight: var(--weight-medium);
    }
    .total-label {
      margin-top: var(--space-6);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.75;
    }
    .total {
      margin: var(--space-1) 0 var(--space-6);
      font-size: var(--text-3xl);
      font-weight: var(--weight-semibold);
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }
    .pending {
      font-size: var(--text-xl);
      opacity: 0.7;
    }
    .send {
      display: inline-flex;
      align-items: center;
      min-height: 2.5rem;
      margin-top: var(--space-6);
      padding: 0 var(--space-5);
      border-radius: var(--radius-m);
      background: var(--color-accent);
      color: var(--color-on-accent);
      font-weight: var(--weight-semibold);
      text-decoration: none;
    }
    .send:hover {
      filter: brightness(1.06);
    }
    .send:focus-visible {
      outline-color: var(--color-accent);
    }
    .figures {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-s);
    }
    .figures li {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-pill);
      background: color-mix(in srgb, currentColor 12%, transparent);
    }
    .figures strong {
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    .columns {
      display: grid;
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
      gap: var(--space-6);
      align-items: start;
    }
    .pad {
      padding: var(--space-5);
    }
    .date {
      width: 7rem;
      white-space: nowrap;
    }
    .accounts {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .accounts li + li {
      border-top: 1px solid var(--color-border);
    }
    .accounts a {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: var(--space-4);
      row-gap: var(--space-1);
      padding: var(--space-4) var(--space-5);
      text-decoration: none;
      color: inherit;
      transition: background-color var(--motion-fast) var(--easing);
    }
    .accounts a:hover {
      background: var(--color-brand-soft);
    }
    .label {
      font-weight: var(--weight-medium);
    }
    .balance {
      grid-column: 2;
      grid-row: 1;
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: var(--weight-semibold);
    }
    .accounts atlas-status-badge {
      grid-column: 2;
      grid-row: 2;
      justify-self: end;
    }
    @media (max-width: 56rem) {
      .columns {
        grid-template-columns: 1fr;
      }
      .hero {
        padding: var(--space-6);
      }
      .total {
        font-size: var(--text-2xl);
      }
    }
  `,
})
export class Dashboard implements OnInit {
  protected readonly accounts = inject(AccountsStore);
  protected readonly cards = inject(CardsStore);
  protected readonly requests = inject(RequestsStore);

  protected readonly firstName = customerFirstName;
  protected readonly categoryLabel = categoryLabel;
  protected readonly maskRib = maskRib;

  protected readonly ready = computed(() =>
    [this.accounts.loaded(), this.cards.loaded(), this.requests.loaded()].every(
      Boolean,
    ),
  );
  protected readonly payFrom = computed(() =>
    this.accounts.accounts().find((a) => a.status === 'active'),
  );
  protected readonly recent = computed(() =>
    this.accounts.recentTransactions().slice(0, recentCount),
  );

  protected readonly spentThisMonth = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    return this.accounts
      .transactions()
      .filter((t) => t.date.startsWith(month) && t.amountMad < 0)
      .reduce((sum, t) => sum - t.amountMad, 0);
  });

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    return hour < 12
      ? 'Good morning'
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening';
  });

  protected accountLabel(accountId: string): string {
    return (
      this.accounts.accounts().find((a) => a.id === accountId)?.label ??
      accountId
    );
  }

  ngOnInit(): void {
    void this.accounts.load();
    void this.cards.load();
    void this.requests.load();
  }
}
