import { computed, inject, Injectable, signal } from '@angular/core';
import type { Account, Beneficiary, Transaction } from '@atlas/domain';
import { FakeBackend } from './fake-backend';

@Injectable({ providedIn: 'root' })
export class AccountsStore {
  private readonly backend = inject(FakeBackend);

  private readonly accountsState = signal<readonly Account[]>([]);
  private readonly transactionsState = signal<readonly Transaction[]>([]);
  private readonly beneficiariesState = signal<readonly Beneficiary[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);
  private inFlight?: Promise<void>;

  readonly accounts = this.accountsState.asReadonly();
  readonly transactions = this.transactionsState.asReadonly();
  readonly beneficiaries = this.beneficiariesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loaded = this.loadedState.asReadonly();

  readonly totalBalanceMad = computed(() =>
    this.accountsState()
      .filter((a) => a.status !== 'closed')
      .reduce((sum, a) => sum + a.balanceMad, 0),
  );

  readonly recentTransactions = computed(() =>
    [...this.transactionsState()].sort((a, b) => (a.date < b.date ? 1 : -1)),
  );

  /** Idempotent: concurrent callers share one in-flight request; later callers resolve immediately. */
  load(): Promise<void> {
    if (this.loadedState()) return Promise.resolve();
    this.inFlight ??= this.fetchAll();
    return this.inFlight;
  }

  private async fetchAll(): Promise<void> {
    this.loadingState.set(true);
    const [accounts, transactions, beneficiaries] = await Promise.all([
      this.backend.getAccounts(),
      this.backend.getTransactions(),
      this.backend.getBeneficiaries(),
    ]);
    this.accountsState.set(accounts);
    this.transactionsState.set(transactions);
    this.beneficiariesState.set(beneficiaries);
    this.loadingState.set(false);
    this.loadedState.set(true);
  }

  byId(id: string) {
    return computed(() => this.accountsState().find((a) => a.id === id));
  }

  transactionsFor(accountId: string) {
    return computed(() =>
      this.recentTransactions().filter((t) => t.accountId === accountId),
    );
  }

  transferredTodayMad(accountId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.transactionsState()
      .filter(
        (t) =>
          t.accountId === accountId &&
          t.category === 'transfer' &&
          t.date === today &&
          t.amountMad < 0,
      )
      .reduce((sum, t) => sum - t.amountMad, 0);
  }

  transactionById(id: string) {
    return computed(() => this.transactionsState().find((t) => t.id === id));
  }

  async transfer(
    fromAccountId: string,
    toRib: string,
    amountMad: number,
    label: string,
  ): Promise<Transaction> {
    const created = await this.backend.transfer(
      fromAccountId,
      toRib,
      amountMad,
      label,
    );
    this.transactionsState.update((all) => [created, ...all]);
    this.accountsState.update((all) =>
      all.map((a) =>
        a.id === fromAccountId
          ? { ...a, balanceMad: a.balanceMad - amountMad }
          : a,
      ),
    );
    return created;
  }
}
