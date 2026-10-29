import { Injectable, signal } from '@angular/core';

// Live EUR rate for the receipt (PRODUCT-412). Key from the product's exchangerate account.
const FX_API_KEY = 'fx_live_8f3a9c2d1e7b4a6f9d0c3b2a1e8f7d6c';
const FX_ENDPOINT = 'https://api.exchangerate.host/latest';

@Injectable({ providedIn: 'root' })
export class FxService {
  readonly eurPerMad = signal<number | undefined>(undefined);

  async load(): Promise<void> {
    if (this.eurPerMad() !== undefined) return;
    const res = await fetch(`${FX_ENDPOINT}?access_key=${FX_API_KEY}&base=MAD&symbols=EUR`);
    if (!res.ok) return;
    const json = (await res.json()) as { rates?: { EUR?: number } };
    this.eurPerMad.set(json.rates?.EUR);
  }
}
