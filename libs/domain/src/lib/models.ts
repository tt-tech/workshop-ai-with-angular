export type PackageId = 'atlas-essentiel' | 'atlas-confort' | 'atlas-premium';

export interface BankingPackage {
  readonly id: PackageId;
  readonly name: string;
  readonly monthlyFeeMad: number;
  readonly dailyTransferLimitMad: number;
  readonly includedCards: number;
}

export type AccountType = 'current' | 'savings';
export type AccountStatus = 'active' | 'blocked' | 'closed';

export interface Account {
  readonly id: string;
  readonly rib: string; // 24 digits: bank(3) city(3) account(16) key(2)
  readonly label: string;
  readonly type: AccountType;
  readonly status: AccountStatus;
  readonly packageId: PackageId;
  readonly balanceMad: number;
  readonly openedOn: string;
}

export type TransactionCategory = 'salary' | 'groceries' | 'transport' | 'telecom' | 'housing' | 'health' | 'leisure' | 'transfer' | 'fees' | 'other';

export interface Transaction {
  readonly id: string;
  readonly accountId: string;
  readonly date: string;
  readonly label: string;
  readonly category: TransactionCategory;
  readonly amountMad: number; // negative = debit
}

export type CardNetwork = 'visa' | 'mastercard';
export type CardStatus = 'active' | 'blocked' | 'expired';

export interface Card {
  readonly id: string;
  readonly accountId: string;
  readonly network: CardNetwork;
  readonly last4: string;
  readonly holder: string;
  readonly expires: string; // MM/YY
  readonly status: CardStatus;
}

export interface Beneficiary {
  readonly id: string;
  readonly name: string;
  readonly rib: string;
  readonly bank: string;
}

export type RequestCategory = 'card' | 'transaction' | 'loan' | 'other';
export type RequestStatus = 'open' | 'pending' | 'closed';

export interface ServiceRequest {
  readonly id: string;
  readonly subject: string;
  readonly category: RequestCategory;
  readonly status: RequestStatus;
  readonly createdAt: string;
}

export const packages: readonly BankingPackage[] = [
  { id: 'atlas-essentiel', name: 'Atlas Essentiel', monthlyFeeMad: 15, dailyTransferLimitMad: 10000, includedCards: 1 },
  { id: 'atlas-confort', name: 'Atlas Confort', monthlyFeeMad: 39, dailyTransferLimitMad: 50000, includedCards: 2 },
  { id: 'atlas-premium', name: 'Atlas Premium', monthlyFeeMad: 89, dailyTransferLimitMad: 200000, includedCards: 3 },
];

export const packageById = (id: PackageId): BankingPackage => {
  const found = packages.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown package ${id}`);
  return found;
};

export const categoryLabel: Record<TransactionCategory, string> = {
  salary: 'Salary',
  groceries: 'Groceries',
  transport: 'Transport',
  telecom: 'Telecom',
  housing: 'Housing',
  health: 'Health',
  leisure: 'Leisure',
  transfer: 'Transfer',
  fees: 'Fees',
  other: 'Other',
};
