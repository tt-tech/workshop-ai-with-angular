import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  AccountsStore,
  FakeBackend,
  RatesStore,
} from '@atlas/data-access-banking';
import type { Transaction } from '@atlas/domain';
import { transfersRoutes } from './transfers.routes';

@Injectable()
class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
  protected override transactions: Transaction[] = [
    {
      id: 't-9',
      accountId: 'a-current',
      date: '2026-10-29',
      label: 'Loyer **octobre** <img src=x onerror=alert(1)>',
      category: 'transfer',
      amountMad: -1500,
    },
  ];
}

// Opened by its URL, like a user arriving from the transfer form; queried by what the user reads.
const open = async () => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [{ path: 'transfers', children: transfersRoutes }],
        withComponentInputBinding(),
      ),
      { provide: FakeBackend, useClass: InstantBackend },
    ],
  });
  const harness = await RouterTestingHarness.create('/transfers/receipt/t-9');
  await TestBed.inject(AccountsStore).load();
  await TestBed.inject(RatesStore).load();
  harness.detectChanges();
  return harness.routeNativeElement as HTMLElement;
};

describe('/transfers/receipt/:txId', () => {
  it('renders the label as text with bold segments, never as markup', async () => {
    const screen = await open();
    expect(screen.querySelector('b')?.textContent).toBe('octobre');
    expect(screen.querySelector('img')).toBeNull();
    expect(screen.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('shows the EUR equivalent from the backend rate', async () => {
    const screen = await open();
    expect(screen.textContent).toContain('1 500,00 MAD');
    expect(screen.textContent).toContain('≈ 138.00 EUR');
  });
});
