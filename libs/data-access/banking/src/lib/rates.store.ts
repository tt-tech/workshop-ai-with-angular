import { inject, Injectable, signal } from '@angular/core';
import { FakeBackend } from './fake-backend';

@Injectable({ providedIn: 'root' })
export class RatesStore {
  private readonly backend = inject(FakeBackend);
  private readonly eurPerMadState = signal<number | undefined>(undefined);
  private inFlight?: Promise<void>;

  readonly eurPerMad = this.eurPerMadState.asReadonly();

  load(): Promise<void> {
    if (this.eurPerMadState() !== undefined) return Promise.resolve();
    this.inFlight ??= this.backend
      .getEurRate()
      .then((rate) => this.eurPerMadState.set(rate));
    return this.inFlight;
  }
}
