import { computed, inject, Injectable, signal } from '@angular/core';
import type { ServiceRequest } from '@atlas/domain';
import { FakeBackend } from './fake-backend';

@Injectable({ providedIn: 'root' })
export class RequestsStore {
  private readonly backend = inject(FakeBackend);

  private readonly requestsState = signal<readonly ServiceRequest[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadedState = signal(false);

  readonly requests = this.requestsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly openCount = computed(() => this.requestsState().filter((r) => r.status !== 'closed').length);

  async load(): Promise<void> {
    if (this.loadedState()) return;
    this.loadingState.set(true);
    this.requestsState.set(await this.backend.getRequests());
    this.loadingState.set(false);
    this.loadedState.set(true);
  }

  async create(request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>): Promise<void> {
    const created = await this.backend.createRequest(request);
    this.requestsState.update((all) => [created, ...all]);
  }
}
