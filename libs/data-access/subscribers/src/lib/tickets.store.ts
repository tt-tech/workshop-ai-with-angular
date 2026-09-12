import { computed, inject, Injectable, signal } from '@angular/core';
import type { Ticket } from '@atlas/domain';
import { FakeBackend } from './fake-backend';

@Injectable({ providedIn: 'root' })
export class TicketsStore {
  private readonly backend = inject(FakeBackend);

  private readonly ticketsState = signal<readonly Ticket[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);

  readonly tickets = this.ticketsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  readonly openCount = computed(() => this.ticketsState().filter((t) => t.status === 'open').length);

  async load(): Promise<void> {
    if (this.loadedState()) return;
    this.loadingState.set(true);
    this.ticketsState.set(await this.backend.getTickets());
    this.loadingState.set(false);
    this.loadedState.set(true);
  }

  forSubscriber(subscriberId: string) {
    return computed(() => this.ticketsState().filter((t) => t.subscriberId === subscriberId));
  }

  async create(ticket: Omit<Ticket, 'id' | 'createdAt' | 'status'>): Promise<void> {
    const created = await this.backend.createTicket(ticket);
    this.ticketsState.update((all) => [...all, created]);
  }
}
