import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';
import type { Account, Beneficiary } from '@atlas/domain';
import { NewTransfer } from './new-transfer';

// Sociable: the real store and the real domain rules participate; only the boundary (FakeBackend) is replaced.
@Injectable()
class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
  protected override accounts: Account[] = [
    { id: 'a-1', rib: '007780000123456789012345', label: 'Current account', type: 'current', status: 'active', packageId: 'atlas-essentiel', balanceMad: 2000, openedOn: '2020-01-01' },
    { id: 'a-blocked', rib: '007780000998877665544332', label: 'Joint account', type: 'current', status: 'blocked', packageId: 'atlas-essentiel', balanceMad: 500, openedOn: '2023-06-30' },
    { id: 'a-premium', rib: '007780000111222333444555', label: 'Premium current', type: 'current', status: 'active', packageId: 'atlas-premium', balanceMad: 900000, openedOn: '2018-02-02' },
  ];
  protected override transactions = [];
  protected override beneficiaries: Beneficiary[] = [
    { id: 'b-1', name: 'Youssef Idrissi', rib: '011780000987654321098765', bank: 'Banque Populaire' },
    { id: 'b-2', name: 'Savings', rib: '007780000123456789054321', bank: 'Atlas Bank' },
  ];
}

const setup = async (accountId = 'a-1') => {
  TestBed.configureTestingModule({
    imports: [NewTransfer],
    providers: [provideRouter([{ path: 'accounts/:id', children: [] }, { path: 'transfers/receipt/:txId', children: [] }], withComponentInputBinding()), { provide: FakeBackend, useClass: InstantBackend }],
  });
  const fixture = TestBed.createComponent(NewTransfer);
  fixture.componentRef.setInput('accountId', accountId);
  fixture.detectChanges();
  await TestBed.inject(AccountsStore).load();
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const type = (selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const submit = async () => {
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  return { fixture, el, type, submit, store: TestBed.inject(AccountsStore), router: TestBed.inject(Router) };
};

describe('NewTransfer', () => {
  it('shows the account and preselects the first beneficiary', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('Current account — 2 000,00 MAD available');
    expect((el.querySelector('select') as HTMLSelectElement).value).toBe('011780000987654321098765');
  });

  it('refuses an amount above the balance with the domain message, and does not move money', async () => {
    const { el, type, submit, store } = await setup();
    type('input[type=number]', '2500');
    await submit();
    expect(el.querySelector('[role=alert]')?.textContent).toBe('The balance does not cover this amount.');
    expect(store.accounts()[0].balanceMad).toBe(2000);
  });

  it('refuses a transfer from a blocked account', async () => {
    const { el, type, submit } = await setup('a-blocked');
    type('input[type=number]', '100');
    await submit();
    expect(el.querySelector('[role=alert]')?.textContent).toBe('This account is blocked. Contact your advisor to unblock it.');
  });

  it('keeps a premium account inside its daily limit, in the UI and at the boundary', async () => {
    const { el, type, submit, store } = await setup('a-premium');
    type('input[type=number]', '250000');
    await submit();
    expect(el.querySelector('[role=alert]')?.textContent).toBe('This transfer exceeds the daily limit of your package.');
    expect(store.accounts().find((a) => a.id === 'a-premium')?.balanceMad).toBe(900000);
    await expect(TestBed.inject(FakeBackend).transfer('a-premium', '011780000987654321098765', 250000, 'x')).rejects.toThrow('daily limit');
  });

  it('moves the money and lands on the receipt', async () => {
    const { type, submit, store, router } = await setup();
    type('input[type=number]', '500');
    type('input[type=text]', 'Loyer');
    await submit();
    expect(store.accounts()[0].balanceMad).toBe(1500);
    expect(router.url).toBe('/transfers/receipt/t-1');
  });
});
