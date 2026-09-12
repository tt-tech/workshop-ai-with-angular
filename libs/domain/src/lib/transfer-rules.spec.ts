import { canTransfer } from './transfer-rules';
import type { Account } from './models';

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'a-1',
  rib: '007780000123456789012345',
  label: 'Current account',
  type: 'current',
  status: 'active',
  packageId: 'atlas-confort',
  balanceMad: 12450,
  openedOn: '2021-04-12',
  ...overrides,
});

const intent = (overrides: Partial<Parameters<typeof canTransfer>[0]> = {}) => ({
  from: account(),
  toRib: '011780000987654321098765',
  amountMad: 1500,
  transferredTodayMad: 0,
  ...overrides,
});

describe('canTransfer', () => {
  it('allows a transfer inside balance and daily limit', () => {
    expect(canTransfer(intent())).toEqual({ ok: true });
  });

  it('rejects a zero or negative amount', () => {
    expect(canTransfer(intent({ amountMad: 0 }))).toEqual({ ok: false, reason: 'invalid-amount' });
  });

  it('rejects a blocked or closed source account', () => {
    expect(canTransfer(intent({ from: account({ status: 'blocked' }) }))).toEqual({ ok: false, reason: 'blocked-account' });
    expect(canTransfer(intent({ from: account({ status: 'closed' }) }))).toEqual({ ok: false, reason: 'closed-account' });
  });

  it('rejects a transfer to the same account', () => {
    expect(canTransfer(intent({ toRib: account().rib }))).toEqual({ ok: false, reason: 'same-account' });
  });

  it('rejects an amount above the balance', () => {
    expect(canTransfer(intent({ amountMad: 20000 }))).toEqual({ ok: false, reason: 'insufficient-funds' });
  });

  it('applies the daily limit of the package including earlier transfers today', () => {
    expect(canTransfer(intent({ from: account({ balanceMad: 100000 }), amountMad: 9000, transferredTodayMad: 45000 }))).toEqual({ ok: false, reason: 'over-daily-limit' });
    expect(canTransfer(intent({ from: account({ balanceMad: 100000 }), amountMad: 4000, transferredTodayMad: 45000 }))).toEqual({ ok: true });
  });
});
