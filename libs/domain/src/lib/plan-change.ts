import { planById, type PlanId, type Subscriber } from './models';

export type PlanChangeVerdict = { readonly ok: true } | { readonly ok: false; readonly reason: PlanChangeBlocker };

export type PlanChangeBlocker = 'same-plan' | 'terminated' | 'suspended-upgrade' | 'negative-balance-upgrade';

const isUpgrade = (from: PlanId, to: PlanId): boolean => planById(to).monthlyPriceMad > planById(from).monthlyPriceMad;

export const canChangePlan = (subscriber: Subscriber, target: PlanId): PlanChangeVerdict => {
  if (subscriber.planId === target) return { ok: false, reason: 'same-plan' };
  if (subscriber.status === 'terminated') return { ok: false, reason: 'terminated' };
  const upgrade = isUpgrade(subscriber.planId, target);
  if (upgrade && subscriber.status === 'suspended') return { ok: false, reason: 'suspended-upgrade' };
  if (upgrade && subscriber.balanceMad < 0) return { ok: false, reason: 'negative-balance-upgrade' };
  return { ok: true };
};

export const blockerMessage: Record<PlanChangeBlocker, string> = {
  'same-plan': 'The subscriber is already on this plan.',
  terminated: 'A terminated contract cannot change plan.',
  'suspended-upgrade': 'A suspended line cannot be upgraded. Reactivate it first.',
  'negative-balance-upgrade': 'Outstanding balance must be settled before an upgrade.',
};
