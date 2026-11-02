import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';
import type { Account, Beneficiary } from '@atlas/domain';
import { transfersRoutes } from './transfers.routes';

// Sociable: the real store, the real routes and the real domain rules participate; only the boundary (FakeBackend) is replaced.
// The screen is driven like a user drives it: fields by their label, the button by its name, messages by their role.
@Injectable()
class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
  protected override accounts: Account[] = [
    {
      id: 'a-1',
      rib: '007780000123456789012345',
      label: 'Current account',
      type: 'current',
      status: 'active',
      packageId: 'atlas-essentiel',
      balanceMad: 2000,
      openedOn: '2020-01-01',
    },
    {
      id: 'a-blocked',
      rib: '007780000998877665544332',
      label: 'Joint account',
      type: 'current',
      status: 'blocked',
      packageId: 'atlas-essentiel',
      balanceMad: 500,
      openedOn: '2023-06-30',
    },
    {
      id: 'a-premium',
      rib: '007780000111222333444555',
      label: 'Premium current',
      type: 'current',
      status: 'active',
      packageId: 'atlas-premium',
      balanceMad: 900000,
      openedOn: '2018-02-02',
    },
  ];
  protected override transactions = [];
  protected override beneficiaries: Beneficiary[] = [
    {
      id: 'b-1',
      name: 'Youssef Idrissi',
      rib: '011780000987654321098765',
      bank: 'Banque Populaire',
    },
    {
      id: 'b-2',
      name: 'Savings',
      rib: '007780000123456789054321',
      bank: 'Atlas Bank',
    },
  ];
}

const open = async (accountId = 'a-1') => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [
          { path: 'transfers', children: transfersRoutes },
          { path: 'accounts/:id', children: [] },
        ],
        withComponentInputBinding(),
      ),
      { provide: FakeBackend, useClass: InstantBackend },
    ],
  });
  const harness = await RouterTestingHarness.create(
    `/transfers/new/${accountId}`,
  );
  await TestBed.inject(AccountsStore).load();
  harness.detectChanges();
  const screen = harness.routeNativeElement as HTMLElement;
  const field = <T extends HTMLElement>(name: string) => {
    const label = Array.from(screen.querySelectorAll('label')).find((l) =>
      l.textContent?.trim().startsWith(name),
    );
    const control = label?.querySelector('input, select');
    if (!control) throw new Error(`No field labelled "${name}"`);
    return control as unknown as T;
  };
  const button = (name: string) => {
    const found = Array.from(screen.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === name,
    );
    if (!found) throw new Error(`No button named "${name}"`);
    return found;
  };
  const type = (name: string, value: string) => {
    const input = field<HTMLInputElement>(name);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  };
  const click = async (name: string) => {
    button(name).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };
  const alert = () => screen.querySelector('[role=alert]')?.textContent?.trim();
  return {
    harness,
    screen,
    field,
    button,
    type,
    click,
    alert,
    store: TestBed.inject(AccountsStore),
    router: TestBed.inject(Router),
  };
};

describe('/transfers/new/:accountId', () => {
  it('shows the account and preselects the first beneficiary', async () => {
    const { screen, field } = await open();
    expect(screen.textContent).toContain(
      'Current account — 2 000,00 MAD available',
    );
    expect(field<HTMLSelectElement>('Beneficiary').value).toBe(
      '011780000987654321098765',
    );
  });

  it('tells the user why an amount above the balance cannot be sent, and moves no money', async () => {
    const { type, click, alert, store } = await open();
    type('Amount (MAD)', '2500');
    await click('Confirm transfer');
    expect(alert()).toBe('The balance does not cover this amount.');
    expect(store.accounts()[0].balanceMad).toBe(2000);
  });

  it('tells the user a blocked account cannot send', async () => {
    const { type, click, alert } = await open('a-blocked');
    type('Amount (MAD)', '100');
    await click('Confirm transfer');
    expect(alert()).toBe(
      'This account is blocked. Contact your advisor to unblock it.',
    );
  });

  it('keeps a premium account inside its daily limit, on the screen and at the boundary', async () => {
    const { type, click, alert, store } = await open('a-premium');
    type('Amount (MAD)', '250000');
    await click('Confirm transfer');
    expect(alert()).toBe(
      'This transfer exceeds the daily limit of your package.',
    );
    expect(store.accounts().find((a) => a.id === 'a-premium')?.balanceMad).toBe(
      900000,
    );
    await expect(
      TestBed.inject(FakeBackend).transfer(
        'a-premium',
        '011780000987654321098765',
        250000,
        'x',
      ),
    ).rejects.toThrow('daily limit');
  });

  it('moves the money and shows the receipt', async () => {
    const { harness, type, click, store, router } = await open();
    type('Amount (MAD)', '500');
    type('Label', 'Loyer');
    await click('Confirm transfer');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(store.accounts()[0].balanceMad).toBe(1500);
    expect(router.url).toBe('/transfers/receipt/t-1');
    expect(harness.routeNativeElement?.textContent).toContain('Loyer');
  });
});
