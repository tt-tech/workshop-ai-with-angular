export type PlanId = 'atlas-start' | 'atlas-plus' | 'atlas-pro' | 'atlas-fiber';

export interface Plan {
  readonly id: PlanId;
  readonly name: string;
  readonly monthlyPriceMad: number;
  readonly dataGb: number;
  readonly minutes: number | 'unlimited';
}

export type SubscriberStatus = 'active' | 'suspended' | 'terminated';

export interface Subscriber {
  readonly id: string;
  readonly msisdn: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly city: string;
  readonly planId: PlanId;
  readonly status: SubscriberStatus;
  readonly contractStart: string;
  readonly balanceMad: number;
}

export type TicketCategory = 'billing' | 'network' | 'plan' | 'other';
export type TicketStatus = 'open' | 'pending' | 'closed';

export interface Ticket {
  readonly id: string;
  readonly subscriberId: string;
  readonly subject: string;
  readonly category: TicketCategory;
  readonly status: TicketStatus;
  readonly createdAt: string;
}

export const plans: readonly Plan[] = [
  { id: 'atlas-start', name: 'Atlas Start', monthlyPriceMad: 49, dataGb: 5, minutes: 120 },
  { id: 'atlas-plus', name: 'Atlas Plus', monthlyPriceMad: 99, dataGb: 20, minutes: 'unlimited' },
  { id: 'atlas-pro', name: 'Atlas Pro', monthlyPriceMad: 199, dataGb: 60, minutes: 'unlimited' },
  { id: 'atlas-fiber', name: 'Atlas Fiber', monthlyPriceMad: 299, dataGb: 500, minutes: 'unlimited' },
];

export const planById = (id: PlanId): Plan => {
  const plan = plans.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan ${id}`);
  return plan;
};
