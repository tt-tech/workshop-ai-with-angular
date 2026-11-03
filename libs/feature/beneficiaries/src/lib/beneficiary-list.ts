import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  type WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Beneficiary, formatMad, formatRib } from '@atlas/domain';
import { AccountsStore } from '@atlas/data-access-banking';
import { Amount, PageHeader } from '@atlas/ui';
import {
  bankFor,
  type BeneficiaryProblem,
  cleanRib,
  defaultAccount,
  problemMessage,
  sentTo,
  validateBeneficiary,
} from './beneficiary-rules';

type SortKey = 'name' | 'sent';

interface PendingBeneficiary extends Beneficiary {
  readonly activatesOn: Date;
}

const sortLabel: Record<SortKey, string> = { name: 'Name', sent: 'Most sent' };
const ribProblems: readonly BeneficiaryProblem[] = [
  'invalid-rib',
  'own-account',
];
const activationDelayMs = 24 * 60 * 60 * 1000;
const activationDateFormat = 'dd/MM/yyyy';
const pendingIdPrefix = 'p-';
const nameMaxLength = 40;
const ribMaxLength = 30;

const countText = (n: number): string =>
  n === 1 ? '1 beneficiary' : `${n} beneficiaries`;

@Component({
  selector: 'atlas-beneficiary-list',
  imports: [DatePipe, RouterLink, Amount, PageHeader],
  template: `
    <atlas-page-header
      title="Beneficiaries"
      [subtitle]="store.loaded() ? summary() : undefined"
    />

    @if (!store.loaded()) {
      <p class="muted">Loading beneficiaries…</p>
    } @else {
      <div class="toolbar">
        <input
          #searchField
          type="text"
          placeholder="Search by name or bank"
          aria-label="Search beneficiaries"
          [value]="search()"
          (input)="search.set(searchField.value)"
        />
        <button
          type="button"
          class="button button--ghost"
          (click)="toggleSort()"
        >
          Sort: {{ sortLabel[sortKey()] }}
        </button>
      </div>

      @let from = sendFrom();
      <div class="card card--flush table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Bank</th>
              <th>RIB</th>
              <th class="num">Sent</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (b of visible(); track b.id) {
              <tr>
                <td class="strong">{{ b.name }}</td>
                <td>{{ b.bank }}</td>
                <td class="mono">{{ formatRib(b.rib) }}</td>
                <td class="num"><atlas-amount [value]="b.sentMad" /></td>
                <td class="num">
                  @if (from) {
                    <button
                      type="button"
                      class="button button--ghost"
                      [routerLink]="['/transfers/new', from.id]"
                    >
                      Send money
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="muted">
                  No beneficiary matches "{{ search() }}".
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (pending().length > 0) {
        <section>
          <h2 class="card__title">Waiting for activation</h2>
          <ul class="pending">
            @for (p of pending(); track p.id) {
              <li [class.is-new]="p.id === justAdded()">
                <span class="strong">{{ p.name }}</span> · {{ p.bank }} ·
                <span class="mono">{{ formatRib(p.rib) }}</span>
                <span class="muted">
                  active on {{ p.activatesOn | date: activationDateFormat }}
                </span>
              </li>
            }
          </ul>
        </section>
      }

      <form
        class="add"
        novalidate
        (submit)="$event.preventDefault(); add(nameField, ribField)"
      >
        <h2 class="card__title">Add a beneficiary</h2>
        <label class="field">
          Name
          <input
            #nameField
            type="text"
            [maxLength]="nameMaxLength"
            [value]="name()"
            (input)="edit(name, nameField.value)"
          />
        </label>
        <label class="field">
          RIB
          <input
            #ribField
            type="text"
            placeholder="24 digits"
            [maxLength]="ribMaxLength"
            [value]="rib()"
            (input)="edit(rib, ribField.value)"
          />
        </label>
        @if (problem(); as p) {
          <p class="alert alert--danger" role="alert">
            {{ problemMessage[p] }}
          </p>
        }
        <button type="submit" class="button">Add beneficiary</button>
      </form>
    }
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    .toolbar input {
      flex: 1 1 14rem;
      width: auto;
    }
    section,
    .add {
      margin-top: var(--space-8);
    }
    .pending {
      margin: var(--space-3) 0 0;
      padding-left: var(--space-5);
    }
    .is-new {
      animation: flash 2s var(--easing);
    }
    @keyframes flash {
      from {
        background: var(--color-brand-soft);
      }
    }
    .add {
      display: grid;
      gap: var(--space-3);
      max-width: 26rem;
    }
    .add .button {
      justify-self: start;
    }
  `,
})
export class BeneficiaryList implements OnInit {
  protected readonly store = inject(AccountsStore);
  protected readonly formatRib = formatRib;
  protected readonly sortLabel = sortLabel;
  protected readonly problemMessage = problemMessage;
  protected readonly activationDateFormat = activationDateFormat;
  protected readonly nameMaxLength = nameMaxLength;
  protected readonly ribMaxLength = ribMaxLength;

  protected readonly search = signal('');
  protected readonly sortKey = signal<SortKey>('name');
  protected readonly name = signal('');
  protected readonly rib = signal('');
  protected readonly problem = signal<BeneficiaryProblem | undefined>(
    undefined,
  );
  protected readonly pending = signal<readonly PendingBeneficiary[]>([]);
  protected readonly justAdded = signal<string | undefined>(undefined);

  private readonly rows = computed(() => {
    const transactions = this.store.transactions();
    return this.store
      .beneficiaries()
      .map((b) => ({ ...b, sentMad: sentTo(b, transactions) }));
  });

  protected readonly visible = computed(() => {
    const term = this.search().toLowerCase().trim();
    const byName = this.sortKey() === 'name';
    return this.rows()
      .filter((b) => `${b.name} ${b.bank}`.toLowerCase().includes(term))
      .sort((a, b) =>
        byName ? a.name.localeCompare(b.name) : a.sentMad - b.sentMad,
      );
  });

  protected readonly summary = computed(() => {
    const count = this.rows().length + this.pending().length;
    const total = this.rows().reduce((sum, b) => sum + Math.abs(b.sentMad), 0);
    return `${countText(count)} · ${formatMad(total)} sent`;
  });

  protected readonly sendFrom = computed(() =>
    defaultAccount(this.store.accounts()),
  );

  ngOnInit(): void {
    void this.store.load();
  }

  protected toggleSort(): void {
    this.sortKey.update((key) => (key === 'name' ? 'sent' : 'name'));
  }

  protected edit(field: WritableSignal<string>, value: string): void {
    field.set(value);
    this.problem.set(undefined);
  }

  protected add(nameField: HTMLInputElement, ribField: HTMLInputElement): void {
    const pending = this.pending();
    const problem = validateBeneficiary(
      { name: this.name(), rib: this.rib() },
      {
        accounts: this.store.accounts(),
        beneficiaries: this.store.beneficiaries(),
        pending,
      },
    );
    this.problem.set(problem);
    if (problem) {
      (ribProblems.includes(problem) ? ribField : nameField).focus();
      return;
    }
    const rib = cleanRib(this.rib());
    const created: PendingBeneficiary = {
      id: pendingIdPrefix + (pending.length + 1),
      name: this.name().trim(),
      rib,
      bank: bankFor(rib),
      activatesOn: new Date(Date.now() + activationDelayMs),
    };
    this.pending.set([...pending, created]);
    this.justAdded.set(created.id);
    this.name.set('');
    this.rib.set('');
    nameField.focus();
  }
}
