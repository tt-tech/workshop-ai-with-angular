import { computed, inject, Injectable, signal } from '@angular/core';
import type { Card } from '@atlas/domain';
import { FakeBackend } from './fake-backend';

@Injectable({ providedIn: 'root' })
export class CardsStore {
  private readonly backend = inject(FakeBackend);

  private readonly cardsState = signal<readonly Card[]>([]);
  private readonly loadedState = signal(false);

  readonly cards = this.cardsState.asReadonly();
  readonly activeCount = computed(() => this.cardsState().filter((c) => c.status === 'active').length);

  async load(): Promise<void> {
    if (this.loadedState()) return;
    this.cardsState.set(await this.backend.getCards());
    this.loadedState.set(true);
  }

  forAccount(accountId: string) {
    return computed(() => this.cardsState().filter((c) => c.accountId === accountId));
  }

  async setStatus(cardId: string, status: Card['status']): Promise<void> {
    const updated = await this.backend.setCardStatus(cardId, status);
    this.cardsState.update((all) => all.map((c) => (c.id === updated.id ? updated : c)));
  }
}
