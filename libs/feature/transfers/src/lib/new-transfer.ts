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
      <form class="form" (submit)="$event.preventDefault(); submit()">
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
            (input)="amountMad.set($any($event.target).valueAsNumber || 0)"
          />
        </label>
        <label class="field">
          Label
          <span class="hint">(use **bold** for emphasis on the receipt)</span>
          <input
            type="text"
            [attr.maxlength]="labelMaxLength"
            (input)="label.set($any($event.target).value)"
          />
        </label>
        @if (error(); as message) {
          <p class="error" role="alert">{{ message }}</p>
        }
        <button
          class="button"
          type="submit"
          [disabled]="!verdict()?.ok || saving()"
        >
          {{ saving() ? 'Sending…' : 'Confirm transfer' }}
        </button>
      </form>
    } @else if (store.loaded()) {
      <p class="muted">Account not found.</p>
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
  styles: `
    .form {
      display: grid;
      gap: 1rem;
      max-width: 34rem;
    }
    .field {
      display: grid;
      gap: 0.35rem;
      color: var(--ink-2);
      font-size: 0.875rem;
    }
    .field input,
    .field select {
      font: inherit;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--line);
      border-radius: 0.5rem;
      color: var(--ink);
      background: var(--paper);
    }
    .hint {
      color: var(--ink-2);
      font-weight: 400;
    }
    .error {
      margin: 0;
      color: #b42318;
    }
    .muted {
      color: var(--ink-2);
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
