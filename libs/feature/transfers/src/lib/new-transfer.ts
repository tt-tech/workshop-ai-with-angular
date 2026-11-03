import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  blockerMessage,
  canTransfer,
  packageById,
  type TransferVerdict,
} from '@atlas/domain';
import { AccountsStore } from '@atlas/data-access-banking';
import { MadPipe, PageHeader } from '@atlas/ui';

const labelMaxLength = 35;

@Component({
  selector: 'atlas-new-transfer',
  imports: [MadPipe, PageHeader],
  template: `
    @let from = account();
    @if (from) {
      <atlas-page-header
        title="New transfer"
        [subtitle]="from.label + ' — ' + (from.balanceMad | mad) + ' available'"
      />
      <div class="layout">
        <form class="form card" (submit)="$event.preventDefault(); submit()">
          <label class="field">
            Beneficiary
            <select (change)="toRib.set($any($event.target).value)">
              @for (b of beneficiaries(); track b.rib) {
                <option [value]="b.rib" [selected]="b.rib === selectedRib()">
                  {{ b.name }} — {{ b.bank }}
                </option>
              }
            </select>
          </label>
          <label class="field">
            Amount (MAD)
            <input
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              (input)="amountMad.set($any($event.target).valueAsNumber || 0)"
            />
          </label>
          <label class="field">
            Label
            <span class="field__hint"
              >Shown on the receipt. Use **bold** for emphasis.</span
            >
            <input
              type="text"
              [attr.maxlength]="labelMaxLength"
              (input)="label.set($any($event.target).value)"
            />
          </label>
          @if (error(); as message) {
            <p class="alert alert--danger" role="alert">{{ message }}</p>
          }
          <button
            class="button button--block"
            type="submit"
            [disabled]="!verdict()?.ok || saving()"
          >
            {{ saving() ? 'Sending…' : 'Confirm transfer' }}
          </button>
        </form>

        <aside class="summary card" aria-label="Transfer summary">
          <h2 class="card__title">Summary</h2>
          <dl>
            <dt>You send</dt>
            <dd class="send">{{ amountMad() | mad }}</dd>
            <dt>To</dt>
            <dd>{{ beneficiary()?.name ?? '—' }}</dd>
            <dt>Balance after</dt>
            <dd [class.negative]="balanceAfter() < 0">
              {{ balanceAfter() | mad }}
            </dd>
            <dt>Left to send today</dt>
            <dd [class.negative]="leftToday() < 0">{{ leftToday() | mad }}</dd>
          </dl>
          <p class="note muted small">
            Daily limit of {{ packageName() }}: {{ dailyLimit() | mad }}.
          </p>
        </aside>
      </div>
    } @else if (store.loaded()) {
      <p class="muted">Account not found.</p>
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: var(--space-6);
      align-items: start;
      max-width: 56rem;
    }
    .form {
      display: grid;
      gap: var(--space-5);
    }
    .summary dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--space-3) var(--space-4);
      margin-top: var(--space-4);
    }
    .summary dt {
      color: var(--color-text-muted);
      font-size: var(--text-s);
    }
    .summary dd {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .send {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
    }
    .negative {
      color: var(--color-danger);
      font-weight: var(--weight-medium);
    }
    .note {
      margin-top: var(--space-5);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }
    @media (max-width: 56rem) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class NewTransfer implements OnInit {
  readonly accountId = input.required<string>();

  protected readonly store = inject(AccountsStore);
  private readonly router = inject(Router);

  protected readonly labelMaxLength = labelMaxLength;
  protected readonly toRib = signal('');
  protected readonly amountMad = signal(0);
  protected readonly label = signal('');
  protected readonly saving = signal(false);

  protected readonly account = computed(() =>
    this.store.byId(this.accountId())(),
  );
  protected readonly beneficiaries = this.store.beneficiaries;
  /** The chosen beneficiary, or the first one until the user picks: derived, never written from a computed. */
  protected readonly selectedRib = computed(
    () => this.toRib() || this.beneficiaries()[0]?.rib || '',
  );

  protected readonly beneficiary = computed(() =>
    this.beneficiaries().find((b) => b.rib === this.selectedRib()),
  );
  protected readonly balanceAfter = computed(
    () => (this.account()?.balanceMad ?? 0) - this.amountMad(),
  );
  private readonly pkg = computed(() =>
    packageById(this.account()?.packageId ?? 'atlas-essentiel'),
  );
  protected readonly packageName = computed(() => this.pkg().name);
  protected readonly dailyLimit = computed(
    () => this.pkg().dailyTransferLimitMad,
  );
  protected readonly leftToday = computed(() => {
    const from = this.account();
    if (!from) return 0;
    return (
      this.dailyLimit() -
      this.store.transferredTodayMad(from.id) -
      this.amountMad()
    );
  });

  protected readonly verdict = computed<TransferVerdict | undefined>(() => {
    const from = this.account();
    if (!from) return undefined;
    return canTransfer({
      from,
      toRib: this.selectedRib(),
      amountMad: this.amountMad(),
      transferredTodayMad: this.store.transferredTodayMad(from.id),
    });
  });

  protected readonly error = computed(() => {
    const verdict = this.verdict();
    return this.amountMad() > 0 && verdict && !verdict.ok
      ? blockerMessage[verdict.reason]
      : undefined;
  });

  ngOnInit(): void {
    void this.store.load();
  }

  async submit(): Promise<void> {
    const from = this.account();
    if (!from || !this.verdict()?.ok) return;
    this.saving.set(true);
    const created = await this.store.transfer(
      from.id,
      this.selectedRib(),
      this.amountMad(),
      this.label(),
    );
    await this.router.navigate(['/transfers/receipt', created.id]);
  }
}
