import type { Account, Beneficiary, Transaction } from '@atlas/domain';
import {
  bankFor,
  defaultAccount,
  sentTo,
  validateBeneficiary,
} from './beneficiary-rules';

const account = (overrides: Partial<Account>): Account => ({
  id: 'a-1',
  rib: '007780000123456789012345',
  label: 'Current account',
  type: 'current',
  status: 'active',
  packageId: 'atlas-confort',
  balanceMad: 20000,
  openedOn: '2020-01-01',
  ...overrides,
});

const transfer = (label: string, amountMad: number): Transaction => ({
  id: label,
  accountId: 'a-1',
  date: '2026-09-02',
  label,
  category: 'transfer',
  amountMad,
});

const youssef: Beneficiary = {
  id: 'b-1',
  name: 'Youssef Idrissi',
  rib: '011780000987654321098765',
  bank: 'Banque Populaire',
};

const book = {
  accounts: [account({})],
  beneficiaries: [youssef],
  pending: [],
};

describe('validateBeneficiary', () => {
  it('accepts a new name with a 24-digit RIB, spaces allowed', () => {
    expect(
      validateBeneficiary(
        { name: 'Hamza Tazi', rib: '230 780 0001122334455667 78' },
        book,
      ),
    ).toBeUndefined();
  });

  it('asks for a name of at least two characters', () => {
    expect(
      validateBeneficiary(
        { name: ' H ', rib: '230780000112233445566778' },
        book,
      ),
    ).toBe('missing-name');
  });

  it('rejects a RIB that does not have 24 digits', () => {
    expect(
      validateBeneficiary({ name: 'Hamza Tazi', rib: '0117800009' }, book),
    ).toBe('invalid-rib');
  });

  it('rejects one of the customer own accounts', () => {
    expect(
      validateBeneficiary(
        { name: 'Me', rib: '007780000123456789012345' },
        book,
      ),
    ).toBe('own-account');
  });

  it('rejects a RIB already known, active or pending', () => {
    expect(
      validateBeneficiary(
        { name: 'Youssef', rib: '011780000987654321098765' },
        book,
      ),
    ).toBe('duplicate');
    expect(
      validateBeneficiary(
        { name: 'Hamza', rib: '230780000112233445566778' },
        { ...book, pending: [{ ...youssef, rib: '230780000112233445566778' }] },
      ),
    ).toBe('duplicate');
  });

  it('refuses a fourth beneficiary waiting for activation', () => {
    const pending = ['1', '2', '3'].map((n) => ({
      ...youssef,
      id: 'p-' + n,
      rib: '23078000011223344556677' + n,
    }));
    expect(
      validateBeneficiary(
        { name: 'Hamza', rib: '230780000112233445566779' },
        { ...book, pending },
      ),
    ).toBe('too-many-pending');
  });
});

describe('bankFor', () => {
  it('names Atlas Bank for its own bank code and Other bank otherwise', () => {
    expect(bankFor('007780000123456789054321')).toBe('Atlas Bank');
    expect(bankFor('230780000112233445566778')).toBe('Other bank');
  });
});

describe('sentTo', () => {
  it('adds the outgoing transfers whose label names the beneficiary or ends of its RIB', () => {
    const transactions = [
      transfer('Virement vers Youssef Idrissi', -1000),
      transfer('Virement vers 8765', -250),
      transfer('Virement vers Savings', -3000),
      transfer('Remboursement Youssef Idrissi', 400),
      {
        ...transfer('Youssef Idrissi café', -30),
        category: 'leisure' as const,
      },
    ];
    expect(sentTo(youssef, transactions)).toBe(-1250);
  });
});

describe('defaultAccount', () => {
  it('picks the active current account, else the first one', () => {
    const savings = account({ id: 'a-2', type: 'savings' });
    const blocked = account({ id: 'a-3', status: 'blocked' });
    const current = account({ id: 'a-4' });
    expect(defaultAccount([savings, blocked, current])?.id).toBe('a-4');
    expect(defaultAccount([savings, blocked])?.id).toBe('a-2');
  });
});
