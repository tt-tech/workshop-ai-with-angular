import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  categoryLabel,
  formatRib,
  packageById,
  type TransactionCategory,
} from '@atlas/domain';
import { AccountsStore, CardsStore } from '@atlas/data-access-banking';
import { Amount, MadPipe, PageHeader, StatusBadge } from '@atlas/ui';

const allCategories = 'all';

@Component({
  selector: 'atlas-account-detail',
  imports: [RouterLink, Amount, MadPipe, PageHeader, StatusBadge],
  template: `
    @let a = account();
    @if (a) {
      <atlas-page-header [title]="a.label" [subtitle]="a.balanceMad | mad">
        <a class="button" [routerLink]="['/transfers/new', a.id]"
          >Make a transfer</a
        >
      </atlas-page-header>

      <div class="columns">
        <section class="card card--flush">
          <div class="card__header">
            <h2 class="card__title">Transactions</h2>
            <label class="filter">
              Category
              <select (change)="category.set($any($event.target).value)">
                <option [value]="allOption">All</option>
                @for (c of categories(); track c) {
                  <option [value]="c">{{ categoryLabel[c] }}</option>
                }
              </select>
            </label>
          </div>
          <table class="table">
            <tbody>
              @for (t of filtered(); track t.id) {
                <tr>
                  <td class="date muted small">{{ t.date }}</td>
                  <td>
                    <span class="strong">{{ t.label }}</span>
                    <div class="muted small">
                      {{ categoryLabel[t.category] }}
                    </div>
                  </td>
                  <td class="num"><atlas-amount [value]="t.amountMad" /></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="muted">
                    No transactions in this category.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <aside class="facts card">
          <h2 class="card__title">Details</h2>
          <dl>
            <dt>Status</dt>
            <dd><atlas-status-badge [status]="a.status" /></dd>
            <dt>RIB</dt>
            <dd class="mono">{{ formatRib(a.rib) }}</dd>
            <dt>Type</dt>
            <dd>{{ a.type }}</dd>
            <dt>Package</dt>
            <dd>
              {{ pkg().name }}
              <div class="muted small">
                {{ pkg().monthlyFeeMad | mad }} per month
              </div>
              <div class="muted small">
                Daily transfer limit
                <span class="nowrap">{{
                  pkg().dailyTransferLimitMad | mad
                }}</span>
              </div>
            </dd>
            <dt>Opened</dt>
            <dd>{{ a.openedOn }}</dd>
          </dl>

          <h2 class="card__title">Cards</h2>
          @for (c of cards(); track c.id) {
            <div class="card-row">
              <span class="mono">{{ c.network }} •••• {{ c.last4 }}</span>
              <span class="muted small">exp. {{ c.expires }}</span>
              <atlas-status-badge [status]="c.status" />
            </div>
          } @empty {
            <p class="muted small">No card linked to this account.</p>
          }
        </aside>
      </div>
    } @else {
      <p class="muted">Loading account…</p>
    }
  `,
  styles: `
    .columns {
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
      gap: var(--space-6);
      align-items: start;
    }
    .filter {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text-muted);
      font-size: var(--text-s);
    }
    .filter select {
      width: auto;
      min-height: 2.25rem;
    }
    .date {
      width: 7rem;
      white-space: nowrap;
    }
    .facts .card__title {
      margin-bottom: var(--space-4);
    }
    .facts .card__title:not(:first-child) {
      margin-top: var(--space-8);
    }
    dl {
      display: grid;
      grid-template-columns: 6rem 1fr;
      row-gap: var(--space-3);
    }
    dt {
      color: var(--color-text-muted);
      font-size: var(--text-s);
    }
    .card-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) 0;
      border-top: 1px solid var(--color-border);
    }
    .card-row atlas-status-badge {
      margin-left: auto;
    }
    @media (max-width: 56rem) {
      .columns {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AccountDetail implements OnInit {
  readonly id = input.required<string>();

  private readonly accounts = inject(AccountsStore);
  private readonly cardsStore = inject(CardsStore);

  protected readonly allOption = allCategories;
  protected readonly category = signal<string>(allCategories);
  protected readonly categoryLabel = categoryLabel;
  protected readonly formatRib = formatRib;

  protected readonly account = computed(() => this.accounts.byId(this.id())());
  protected readonly pkg = computed(() =>
    packageById(this.account()?.packageId ?? 'atlas-essentiel'),
  );
  protected readonly transactions = computed(() =>
    this.accounts.transactionsFor(this.id())(),
  );
  protected readonly cards = computed(() =>
    this.cardsStore.forAccount(this.id())(),
  );

  protected readonly categories = computed(
    () =>
      [
        ...new Set(this.transactions().map((t) => t.category)),
      ].sort() as TransactionCategory[],
  );

  protected readonly filtered = computed(() => {
    const category = this.category();
    const all = this.transactions();
    return category === allCategories
      ? all
      : all.filter((t) => t.category === category);
  });

  ngOnInit(): void {
    void this.accounts.load();
    void this.cardsStore.load();
  }
}
