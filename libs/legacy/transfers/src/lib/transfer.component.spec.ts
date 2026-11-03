import { TransferComponent } from './transfer.component';

// Task 000: characterisation tests. They record what validate() does TODAY, bugs included.
// Nothing outside *.spec.ts changed. The new feature (task 002) is compared against this list.
const component = () => new TransferComponent({} as any, {} as any, {} as any, {} as any);

const active = { id: 'a-1', rib: '007780000123456789012345', status: 'active', packageId: 'atlas-essentiel', balanceMad: 2000 };

describe('legacy TransferComponent.validate() — pinned behaviour', () => {
  it('reports a missing account', () => {
    const c = component();
    expect(c.validate()).toBe('No account.');
  });

  it('rejects a zero or negative amount', () => {
    const c = component();
    c.account = active;
    c.amount = 0;
    expect(c.validate()).toBe('Enter an amount above 0 MAD.');
  });

  it('rejects a closed account', () => {
    const c = component();
    c.account = { ...active, status: 'closed' };
    c.amount = 10;
    expect(c.validate()).toBe('This account is closed.');
  });

  it('rejects a blocked account with the advisor message', () => {
    const c = component();
    c.account = { ...active, status: 'blocked' };
    c.amount = 10;
    expect(c.validate()).toBe('This account is blocked. Contact your advisor to unblock it.');
  });

  it('rejects a transfer to the same RIB', () => {
    const c = component();
    c.account = active;
    c.amount = 10;
    c.selectedRib = active.rib;
    expect(c.validate()).toBe('The destination is the same account.');
  });

  it('rejects an amount above the balance', () => {
    const c = component();
    c.account = active;
    c.amount = 2500;
    c.selectedRib = '011780000987654321098765';
    expect(c.validate()).toBe('The balance does not cover this amount.');
  });

  it('rejects an amount above the package daily limit', () => {
    const c = component();
    c.account = { ...active, balanceMad: 50000 };
    c.amount = 10001;
    c.selectedRib = '011780000987654321098765';
    expect(c.validate()).toBe('This transfer exceeds the daily limit of your package.');
  });

  // TODO 000: looks wrong because the limit is checked against this one amount only; a second transfer today of 9 000 after a first of 9 000 passes. The domain rule canTransfer() counts transferredTodayMad.
  it('ignores earlier transfers today when checking the daily limit', () => {
    const c = component();
    c.account = { ...active, balanceMad: 50000 };
    c.amount = 9000;
    c.selectedRib = '011780000987654321098765';
    expect(c.validate()).toBe('');
  });

  it('accepts a valid transfer with an empty message', () => {
    const c = component();
    c.account = active;
    c.amount = 500;
    c.selectedRib = '011780000987654321098765';
    expect(c.validate()).toBe('');
  });
});
