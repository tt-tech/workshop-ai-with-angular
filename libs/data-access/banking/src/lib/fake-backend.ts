import { inject, Injectable, PendingTasks } from '@angular/core';
import { blockerMessage, canTransfer, type Account, type Beneficiary, type Card, type ServiceRequest, type Transaction } from '@atlas/domain';

// The system boundary. Tests may replace this with a fake; nothing else in the app talks to "the server".
// Everything below is invented demo data. Latency is simulated so loading states are real.

const defaultLatencyMs = 250;

const seedAccounts: Account[] = [
  { id: 'a-current', rib: '007780000123456789012345', label: 'Current account', type: 'current', status: 'active', packageId: 'atlas-confort', balanceMad: 18642.35, openedOn: '2019-09-02' },
  { id: 'a-savings', rib: '007780000123456789054321', label: 'Savings', type: 'savings', status: 'active', packageId: 'atlas-confort', balanceMad: 46200, openedOn: '2021-01-18' },
  { id: 'a-joint', rib: '007780000998877665544332', label: 'Joint account', type: 'current', status: 'blocked', packageId: 'atlas-essentiel', balanceMad: 1250.8, openedOn: '2023-06-30' },
];

const seedTransactions: Transaction[] = [
  { id: 't-1', accountId: 'a-current', date: '2026-09-11', label: 'Marjane Californie', category: 'groceries', amountMad: -642.5 },
  { id: 't-2', accountId: 'a-current', date: '2026-09-10', label: 'Orange Maroc — forfait', category: 'telecom', amountMad: -199 },
  { id: 't-3', accountId: 'a-current', date: '2026-09-09', label: 'Autoroutes du Maroc', category: 'transport', amountMad: -68 },
  { id: 't-4', accountId: 'a-current', date: '2026-09-08', label: 'Glovo', category: 'leisure', amountMad: -127.4 },
  { id: 't-5', accountId: 'a-current', date: '2026-09-05', label: 'Loyer septembre', category: 'housing', amountMad: -6500 },
  { id: 't-6', accountId: 'a-current', date: '2026-09-03', label: 'Pharmacie Al Amal', category: 'health', amountMad: -214.9 },
  { id: 't-7', accountId: 'a-current', date: '2026-09-01', label: 'Salaire — Atlas Tech SARL', category: 'salary', amountMad: 21500 },
  { id: 't-8', accountId: 'a-current', date: '2026-08-30', label: 'Virement vers Savings', category: 'transfer', amountMad: -3000 },
  { id: 't-9', accountId: 'a-current', date: '2026-08-28', label: 'Carrefour Market', category: 'groceries', amountMad: -388.15 },
  { id: 't-10', accountId: 'a-current', date: '2026-08-27', label: 'TotalEnergies Aïn Sebaâ', category: 'transport', amountMad: -450 },
  { id: 't-11', accountId: 'a-current', date: '2026-08-25', label: 'Frais de tenue de compte', category: 'fees', amountMad: -39 },
  { id: 't-12', accountId: 'a-savings', date: '2026-08-30', label: 'Virement depuis Current account', category: 'transfer', amountMad: 3000 },
  { id: 't-13', accountId: 'a-savings', date: '2026-07-31', label: 'Intérêts trimestriels', category: 'other', amountMad: 312.4 },
  { id: 't-14', accountId: 'a-joint', date: '2026-09-06', label: 'Maroc Telecom — fibre', category: 'telecom', amountMad: -349 },
  { id: 't-15', accountId: 'a-joint', date: '2026-09-02', label: 'Lydec — eau & électricité', category: 'housing', amountMad: -612.3 },
];

const seedCards: Card[] = [
  { id: 'c-1', accountId: 'a-current', network: 'visa', last4: '4821', holder: 'SALMA IDRISSI', expires: '08/28', status: 'active' },
  { id: 'c-2', accountId: 'a-joint', network: 'mastercard', last4: '0937', holder: 'SALMA IDRISSI', expires: '02/27', status: 'blocked' },
];

const seedBeneficiaries: Beneficiary[] = [
  { id: 'b-1', name: 'Youssef Idrissi', rib: '011780000987654321098765', bank: 'Banque Populaire' },
  { id: 'b-2', name: 'Imm. Al Manar — syndic', rib: '022780000112233445566778', bank: 'Bank of Africa' },
  { id: 'b-3', name: 'Savings', rib: '007780000123456789054321', bank: 'Atlas Bank' },
];

const seedRequests: ServiceRequest[] = [
  { id: 'r-1', subject: 'Dispute: duplicate charge at Marjane on 11 Sep', category: 'transaction', status: 'open', createdAt: '2026-09-12' },
  { id: 'r-2', subject: 'Unblock joint account card', category: 'card', status: 'pending', createdAt: '2026-09-04' },
  { id: 'r-3', subject: 'Car loan simulation — 180 000 MAD over 60 months', category: 'loan', status: 'open', createdAt: '2026-08-29' },
  { id: 'r-4', subject: 'Address change', category: 'other', status: 'closed', createdAt: '2026-07-15' },
];

const demoEurPerMad = 0.092;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable({ providedIn: 'root' })
export class FakeBackend {
  /** Test doubles set this to 0 so a zoneless `whenStable()` does not have to wait for a timer. */
  protected readonly latencyMs: number = defaultLatencyMs;
  /** Every call is a pending task, so a zoneless `whenStable()` waits for the "server" the way it waits for the router. */
  private readonly pending = inject(PendingTasks);
  // Protected so a test double can swap the dataset while keeping every method's behaviour (transfer() must see the same accounts getAccounts() returns).
  protected accounts: Account[] = [...seedAccounts];
  protected transactions: Transaction[] = [...seedTransactions];
  protected cards: Card[] = [...seedCards];
  protected requests: ServiceRequest[] = [...seedRequests];
  protected beneficiaries: Beneficiary[] = [...seedBeneficiaries];

  private async delay(): Promise<void> {
    const done = this.pending.add();
    try {
      if (this.latencyMs > 0) await wait(this.latencyMs);
    } finally {
      done();
    }
  }

  async getAccounts(): Promise<Account[]> {
    await this.delay();
    return [...this.accounts];
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.delay();
    return [...this.transactions];
  }

  async getCards(): Promise<Card[]> {
    await this.delay();
    return [...this.cards];
  }

  async getBeneficiaries(): Promise<Beneficiary[]> {
    await this.delay();
    return [...this.beneficiaries];
  }

  async getRequests(): Promise<ServiceRequest[]> {
    await this.delay();
    return [...this.requests];
  }

  /** The demo "exchange rate service": the key for the real one lives here, server side, never in the bundle. */
  async getEurRate(): Promise<number> {
    await this.delay();
    return demoEurPerMad;
  }

  async transfer(fromAccountId: string, toRib: string, amountMad: number, label: string): Promise<Transaction> {
    await this.delay();
    const index = this.accounts.findIndex((a) => a.id === fromAccountId);
    if (index === -1) throw new Error(`Unknown account ${fromAccountId}`);
    const from = this.accounts[index];
    // The rule is enforced at the boundary. The client runs the same check for the UX; the server runs it for real.
    const verdict = canTransfer({ from, toRib, amountMad, transferredTodayMad: this.transferredToday(fromAccountId) });
    if (!verdict.ok) throw new Error(blockerMessage[verdict.reason]);
    this.accounts = this.accounts.with(index, { ...from, balanceMad: from.balanceMad - amountMad });
    const created: Transaction = {
      id: `t-${this.transactions.length + 1}`,
      accountId: fromAccountId,
      date: new Date().toISOString().slice(0, 10),
      label: label || `Virement vers ${toRib.slice(-4)}`,
      category: 'transfer',
      amountMad: -amountMad,
    };
    this.transactions = [created, ...this.transactions];
    return created;
  }

  private transferredToday(accountId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.transactions
      .filter((t) => t.accountId === accountId && t.category === 'transfer' && t.date === today && t.amountMad < 0)
      .reduce((sum, t) => sum - t.amountMad, 0);
  }

  async setCardStatus(cardId: string, status: Card['status']): Promise<Card> {
    await this.delay();
    const index = this.cards.findIndex((c) => c.id === cardId);
    if (index === -1) throw new Error(`Unknown card ${cardId}`);
    const updated: Card = { ...this.cards[index], status };
    this.cards = this.cards.with(index, updated);
    return updated;
  }

  async createRequest(request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>): Promise<ServiceRequest> {
    await this.delay();
    const created: ServiceRequest = { ...request, id: `r-${this.requests.length + 1}`, status: 'open', createdAt: new Date().toISOString().slice(0, 10) };
    this.requests = [created, ...this.requests];
    return created;
  }
}
