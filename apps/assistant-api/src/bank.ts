import type { Account, Transaction } from '@atlas/domain';

export interface Session {
  readonly userId: string;
}

export const demoSession: Session = { userId: 'u-salma' };
export const demoMonth = '2026-09';

interface OwnedAccount extends Account {
  readonly ownerId: string;
}

const seedAccounts: readonly OwnedAccount[] = [
  { id: 'a-current', ownerId: 'u-salma', rib: '007780000123456789012345', label: 'Current account', type: 'current', status: 'active', packageId: 'atlas-confort', balanceMad: 18642.35, openedOn: '2019-09-02' },
  { id: 'a-savings', ownerId: 'u-salma', rib: '007780000123456789054321', label: 'Savings', type: 'savings', status: 'active', packageId: 'atlas-confort', balanceMad: 46200, openedOn: '2021-01-18' },
  { id: 'a-joint', ownerId: 'u-salma', rib: '007780000998877665544332', label: 'Joint account', type: 'current', status: 'blocked', packageId: 'atlas-essentiel', balanceMad: 1250.8, openedOn: '2023-06-30' },
  { id: 'a-youssef', ownerId: 'u-youssef', rib: '011780000987654321098765', label: 'Youssef current account', type: 'current', status: 'active', packageId: 'atlas-premium', balanceMad: 93120.4, openedOn: '2018-03-12' },
];

const seedTransactions: readonly Transaction[] = [
  { id: 't-1', accountId: 'a-current', date: '2026-09-11', label: 'Marjane Californie', category: 'groceries', amountMad: -642.5 },
  { id: 't-2', accountId: 'a-current', date: '2026-09-10', label: 'Orange Maroc — forfait', category: 'telecom', amountMad: -199 },
  { id: 't-3', accountId: 'a-current', date: '2026-09-09', label: 'Autoroutes du Maroc', category: 'transport', amountMad: -68 },
  { id: 't-4', accountId: 'a-current', date: '2026-09-08', label: 'Glovo', category: 'leisure', amountMad: -127.4 },
  { id: 't-5', accountId: 'a-current', date: '2026-09-05', label: 'Loyer septembre', category: 'housing', amountMad: -6500 },
  { id: 't-6', accountId: 'a-current', date: '2026-09-03', label: 'Pharmacie Al Amal', category: 'health', amountMad: -214.9 },
  { id: 't-7', accountId: 'a-current', date: '2026-09-01', label: 'Salaire — Atlas Tech SARL', category: 'salary', amountMad: 21500 },
  { id: 't-8', accountId: 'a-current', date: '2026-08-30', label: 'Virement vers Savings', category: 'transfer', amountMad: -3000 },
  { id: 't-9', accountId: 'a-current', date: '2026-08-28', label: 'Carrefour Market', category: 'groceries', amountMad: -388.15 },
  { id: 't-12', accountId: 'a-savings', date: '2026-08-30', label: 'Virement depuis Current account', category: 'transfer', amountMad: 3000 },
  { id: 't-14', accountId: 'a-joint', date: '2026-09-06', label: 'Maroc Telecom — fibre', category: 'telecom', amountMad: -349 },
  { id: 't-20', accountId: 'a-youssef', date: '2026-09-04', label: 'Concession auto', category: 'other', amountMad: -45000 },
];

export class AccessDenied extends Error {}

export const ownAccount = (session: Session, accountId: string): Account => {
  const account = seedAccounts.find((candidate) => candidate.id === accountId && candidate.ownerId === session.userId);
  if (!account) throw new AccessDenied(`Account ${accountId} is not one of your accounts.`);
  return account;
};

export const transactionsOf = (session: Session, accountId: string): readonly Transaction[] => {
  const { id } = ownAccount(session, accountId);
  return seedTransactions.filter((transaction) => transaction.accountId === id).toSorted((left, right) => right.date.localeCompare(left.date));
};

export const accountsOf = (session: Session): readonly Account[] => seedAccounts.filter((account) => account.ownerId === session.userId);
