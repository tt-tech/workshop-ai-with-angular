import { computed, inject, Injectable, signal } from '@angular/core';
import type { PlanId, Subscriber } from '@atlas/domain';
import { FakeBackend } from './fake-backend';

@Injectable({ providedIn: 'root' })
export class SubscribersStore {
  private readonly backend = inject(FakeBackend);

  private readonly subscribersState = signal<readonly Subscriber[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);

  readonly subscribers = this.subscribersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loaded = this.loadedState.asReadonly();

  readonly cities = computed(() => [...new Set(this.subscribersState().map((s) => s.city))].sort());

  async load(): Promise<void> {
    if (this.loadedState()) return;
    this.loadingState.set(true);
    this.subscribersState.set(await this.backend.getSubscribers());
    this.loadingState.set(false);
    this.loadedState.set(true);
  }

  byId(id: string) {
    return computed(() => this.subscribersState().find((s) => s.id === id));
  }

  async changePlan(subscriberId: string, planId: PlanId): Promise<void> {
    const updated = await this.backend.changePlan(subscriberId, planId);
    this.subscribersState.update((all) => all.map((s) => (s.id === updated.id ? updated : s)));
  }
}
