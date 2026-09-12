import { canChangePlan } from './plan-change';
import type { Subscriber } from './models';

const subscriber = (overrides: Partial<Subscriber> = {}): Subscriber => ({
  id: 's1',
  msisdn: '212612345678',
  firstName: 'Salma',
  lastName: 'Idrissi',
  city: 'Casablanca',
  planId: 'atlas-plus',
  status: 'active',
  contractStart: '2024-03-01',
  balanceMad: 0,
  ...overrides,
});

describe('canChangePlan', () => {
  it('allows an active subscriber with a settled balance to upgrade', () => {
    expect(canChangePlan(subscriber(), 'atlas-pro')).toEqual({ ok: true });
  });

  it('refuses the plan the subscriber is already on', () => {
    expect(canChangePlan(subscriber(), 'atlas-plus')).toEqual({ ok: false, reason: 'same-plan' });
  });

  it('refuses any change on a terminated contract', () => {
    expect(canChangePlan(subscriber({ status: 'terminated' }), 'atlas-start')).toEqual({ ok: false, reason: 'terminated' });
  });

  it('lets a suspended line downgrade but not upgrade', () => {
    expect(canChangePlan(subscriber({ status: 'suspended' }), 'atlas-start')).toEqual({ ok: true });
    expect(canChangePlan(subscriber({ status: 'suspended' }), 'atlas-pro')).toEqual({ ok: false, reason: 'suspended-upgrade' });
  });

  it('blocks an upgrade while the balance is negative', () => {
    expect(canChangePlan(subscriber({ balanceMad: -120 }), 'atlas-pro')).toEqual({ ok: false, reason: 'negative-balance-upgrade' });
  });
});
