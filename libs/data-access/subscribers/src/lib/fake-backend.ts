import { Injectable } from '@angular/core';
import type { PlanId, Subscriber, Ticket } from '@atlas/domain';

// The system boundary. Tests may replace this with a fake; nothing else in the app talks to "the server".
// Seed data is invented. Latency is simulated so loading states are real.

const latencyMs = 250;

const seedSubscribers: Subscriber[] = [
  { id: 's-1001', msisdn: '212612345678', firstName: 'Salma', lastName: 'Idrissi', city: 'Casablanca', planId: 'atlas-plus', status: 'active', contractStart: '2024-03-01', balanceMad: 0 },
  { id: 's-1002', msisdn: '212661234567', firstName: 'Youssef', lastName: 'Benali', city: 'Rabat', planId: 'atlas-pro', status: 'active', contractStart: '2023-11-15', balanceMad: -85 },
  { id: 's-1003', msisdn: '212700112233', firstName: 'Khadija', lastName: 'El Amrani', city: 'Tangier', planId: 'atlas-start', status: 'suspended', contractStart: '2025-01-20', balanceMad: -210 },
  { id: 's-1004', msisdn: '212655667788', firstName: 'Omar', lastName: 'Tazi', city: 'Casablanca', planId: 'atlas-fiber', status: 'active', contractStart: '2022-06-01', balanceMad: 0 },
  { id: 's-1005', msisdn: '212698765432', firstName: 'Nadia', lastName: 'Chraibi', city: 'Marrakech', planId: 'atlas-plus', status: 'terminated', contractStart: '2021-09-10', balanceMad: 0 },
  { id: 's-1006', msisdn: '212611223344', firstName: 'Mehdi', lastName: 'Ouazzani', city: 'Tangier', planId: 'atlas-start', status: 'active', contractStart: '2025-05-05', balanceMad: 12 },
  { id: 's-1007', msisdn: '212677889900', firstName: 'Imane', lastName: 'Berrada', city: 'Rabat', planId: 'atlas-pro', status: 'active', contractStart: '2024-08-18', balanceMad: 0 },
  { id: 's-1008', msisdn: '212644556677', firstName: 'Hamza', lastName: 'Lahlou', city: 'Fes', planId: 'atlas-plus', status: 'active', contractStart: '2023-02-27', balanceMad: -30 },
];

const seedTickets: Ticket[] = [
  { id: 't-5001', subscriberId: 's-1002', subject: 'Double charge on August invoice', category: 'billing', status: 'open', createdAt: '2026-09-02' },
  { id: 't-5002', subscriberId: 's-1003', subject: 'No 4G coverage in Tangier Malabata', category: 'network', status: 'pending', createdAt: '2026-08-28' },
  { id: 't-5003', subscriberId: 's-1001', subject: 'Wants to move to Atlas Pro', category: 'plan', status: 'open', createdAt: '2026-09-10' },
  { id: 't-5004', subscriberId: 's-1006', subject: 'SIM replacement request', category: 'other', status: 'closed', createdAt: '2026-07-14' },
  { id: 't-5005', subscriberId: 's-1008', subject: 'Balance not updated after payment', category: 'billing', status: 'open', createdAt: '2026-09-11' },
];

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable({ providedIn: 'root' })
export class FakeBackend {
  private subscribers: Subscriber[] = [...seedSubscribers];
  private tickets: Ticket[] = [...seedTickets];

  async getSubscribers(): Promise<Subscriber[]> {
    await delay(latencyMs);
    return [...this.subscribers];
  }

  async getTickets(): Promise<Ticket[]> {
    await delay(latencyMs);
    return [...this.tickets];
  }

  async changePlan(subscriberId: string, planId: PlanId): Promise<Subscriber> {
    await delay(latencyMs);
    const index = this.subscribers.findIndex((s) => s.id === subscriberId);
    if (index === -1) throw new Error(`Unknown subscriber ${subscriberId}`);
    const updated: Subscriber = { ...this.subscribers[index], planId };
    this.subscribers = this.subscribers.with(index, updated);
    return updated;
  }

  async createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'status'>): Promise<Ticket> {
    await delay(latencyMs);
    const created: Ticket = { ...ticket, id: `t-${5000 + this.tickets.length + 1}`, status: 'open', createdAt: new Date().toISOString().slice(0, 10) };
    this.tickets = [...this.tickets, created];
    return created;
  }
}
