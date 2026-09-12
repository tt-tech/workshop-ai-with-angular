import { TestBed } from '@angular/core/testing';
import { AccountsStore } from './accounts.store';

describe('AccountsStore', () => {
  const setup = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(AccountsStore);
  };

  it('loads once and sums the balance of open accounts', async () => {
    const store = setup();
    await store.load();
    await store.load();

    expect(store.loaded()).toBe(true);
    const expected = store
      .accounts()
      .filter((a) => a.status !== 'closed')
      .reduce((sum, a) => sum + a.balanceMad, 0);
    expect(store.totalBalanceMad()).toBeCloseTo(expected, 2);
  });

  it('records a transfer as a debit and lowers the balance', async () => {
    const store = setup();
    await store.load();
    const before = store.byId('a-current')();
    expect(before).toBeDefined();
    const count = store.transactionsFor('a-current')().length;

    await store.transfer('a-current', '011780000987654321098765', 500, 'Test');

    expect(store.byId('a-current')()?.balanceMad).toBeCloseTo((before?.balanceMad ?? 0) - 500, 2);
    expect(store.transactionsFor('a-current')().length).toBe(count + 1);
    expect(store.transactionsFor('a-current')()[0].amountMad).toBe(-500);
  });
});
