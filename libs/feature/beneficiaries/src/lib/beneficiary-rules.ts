import type { Account, Beneficiary, Transaction } from '@atlas/domain';

const ribPattern = /^\d{24}$/;
const minNameLength = 2;
const maxPending = 3;
const ribDigitsInLabel = 4;
const atlasBankCode = '007';
const atlasBankName = 'Atlas Bank';
const otherBankName = 'Other bank';

export type BeneficiaryProblem =
  | 'missing-name'
  | 'invalid-rib'
  | 'own-account'
  | 'duplicate'
  | 'too-many-pending';

export const problemMessage: Record<BeneficiaryProblem, string> = {
  'missing-name': 'Enter the beneficiary name.',
  'invalid-rib': 'A RIB has 24 digits.',
  'own-account': 'This RIB is one of your own accounts.',
  duplicate: 'This beneficiary already exists.',
  'too-many-pending': 'Three beneficiaries are already waiting for activation.',
};

export interface BeneficiaryEntry {
  readonly name: string;
  readonly rib: string;
}

export interface BeneficiaryBook {
  readonly accounts: readonly Account[];
  readonly beneficiaries: readonly Beneficiary[];
  readonly pending: readonly Beneficiary[];
}

export const cleanRib = (rib: string): string => rib.replace(/\s/g, '');

export const validateBeneficiary = (
  entry: BeneficiaryEntry,
  { accounts, beneficiaries, pending }: BeneficiaryBook,
): BeneficiaryProblem | undefined => {
  const rib = cleanRib(entry.rib);
  if (entry.name.trim().length < minNameLength) return 'missing-name';
  if (!ribPattern.test(rib)) return 'invalid-rib';
  if (accounts.some((a) => a.rib === rib)) return 'own-account';
  if ([...beneficiaries, ...pending].some((b) => b.rib === rib))
    return 'duplicate';
  if (pending.length >= maxPending) return 'too-many-pending';
  return undefined;
};

export const bankFor = (rib: string): string =>
  rib.startsWith(atlasBankCode) ? atlasBankName : otherBankName;

export const sentTo = (
  beneficiary: Beneficiary,
  transactions: readonly Transaction[],
): number => {
  const name = beneficiary.name.toLowerCase();
  const ribEnd = beneficiary.rib.slice(-ribDigitsInLabel);
  return transactions
    .filter((t) => t.category === 'transfer' && t.amountMad < 0)
    .filter((t) => {
      const label = t.label.toLowerCase();
      return label.includes(name) || label.includes(ribEnd);
    })
    .reduce((total, t) => total + t.amountMad, 0);
};

export const defaultAccount = (
  accounts: readonly Account[],
): Account | undefined =>
  accounts.find((a) => a.type === 'current' && a.status === 'active') ??
  accounts[0];
