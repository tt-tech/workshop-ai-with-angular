import type { Transaction } from '@atlas/domain';
import { toCsv } from './transactions-csv';

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 't-1',
  accountId: 'a-1',
  date: '2026-09-11',
  label: 'Marjane Californie',
  category: 'groceries',
  amountMad: -642.5,
  ...overrides,
});

describe('toCsv', () => {
  it('writes a header and one row per transaction with category label and MAD amount', () => {
    expect(
      toCsv([
        transaction({}),
        transaction({
          id: 't-2',
          date: '2026-09-01',
          label: 'Salaire — Atlas Tech SARL',
          category: 'salary',
          amountMad: 21500,
        }),
      ]),
    ).toBe(
      'Date,Label,Category,Amount\r\n' +
        '2026-09-11,Marjane Californie,Groceries,"-642,50 MAD"\r\n' +
        '2026-09-01,Salaire — Atlas Tech SARL,Salary,"21 500,00 MAD"',
    );
  });

  it('quotes a label containing a comma, a quote or a line break', () => {
    expect(
      toCsv([
        transaction({
          label: 'Café "Atlas", Rabat\nTicket 12',
          amountMad: -39,
        }),
      ]),
    ).toBe(
      'Date,Label,Category,Amount\r\n' +
        '2026-09-11,"Café ""Atlas"", Rabat\nTicket 12",Groceries,"-39,00 MAD"',
    );
  });

  it('writes only the header when there are no transactions', () => {
    expect(toCsv([])).toBe('Date,Label,Category,Amount');
  });
});
