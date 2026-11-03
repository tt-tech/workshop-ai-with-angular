import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';
import type { Account, Beneficiary } from '@atlas/domain';
import { TransferService } from './transfer.service';

// Task 000: characterisation tests. They record what TransferService does TODAY, through the real AccountsStore.
// Only the boundary (FakeBackend) is replaced, with an instant one.
@Injectable()
class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
  protected override accounts: Account[] = [
    { id: 'a-1', rib: '007780000123456789012345', label: 'Current account', type: 'current', status: 'active', packageId: 'atlas-essentiel', balanceMad: 50000, openedOn: '2020-01-01' },
  ];
  protected override transactions = [];
  protected override beneficiaries: Beneficiary[] = [
    { id: 'b-1', name: 'Youssef Idrissi', rib: '011780000987654321098765', bank: 'Banque Populaire' },
    { id: 'b-2', name: 'Savings', rib: '007780000123456789054321', bank: 'Atlas Bank' },
  ];
}

const setup = async () => {
  TestBed.configureTestingModule({ providers: [TransferService, { provide: FakeBackend, useClass: InstantBackend }] });
  const store = TestBed.inject(AccountsStore);
  await store.load();
  return { service: TestBed.inject(TransferService), store };
};

describe('legacy TransferService — pinned behaviour', () => {
  it('getAccount emits the account with that id', async () => {
    const { service } = await setup();
    const account = await firstValueFrom(service.getAccount('a-1'));
    expect(account.label).toBe('Current account');
    expect(account.balanceMad).toBe(50000);
  });

  it('getAccount emits null for an unknown id', async () => {
    const { service } = await setup();
    expect(await firstValueFrom(service.getAccount('a-unknown'))).toBeNull();
  });

  it('getBeneficiaries emits every beneficiary in backend order', async () => {
    const { service } = await setup();
    const beneficiaries = await firstValueFrom(service.getBeneficiaries());
    expect(beneficiaries.map((b) => b.name)).toEqual(['Youssef Idrissi', 'Savings']);
    expect(beneficiaries[0].rib).toBe('011780000987654321098765');
  });

  it('transfer lowers the balance in the store and records a debit', async () => {
    const { service, store } = await setup();
    await firstValueFrom(service.transfer('a-1', '011780000987654321098765', 500, 'Loyer'));
    expect(store.byId('a-1')()?.balanceMad).toBe(49500);
    expect(store.transactionsFor('a-1')()[0].amountMad).toBe(-500);
    expect(store.transactionsFor('a-1')()[0].label).toBe('Loyer');
  });

  // TODO 000: looks wrong because validate() lets this transfer through (it ignores earlier transfers today) and the user only learns about the limit from the backend error.
  it('transfer errors with the backend message when earlier transfers today exceed the daily limit', async () => {
    const { service, store } = await setup();
    await firstValueFrom(service.transfer('a-1', '011780000987654321098765', 9000, 'First'));
    await expect(firstValueFrom(service.transfer('a-1', '011780000987654321098765', 9000, 'Second'))).rejects.toThrow('This transfer exceeds the daily limit of your package.');
    expect(store.byId('a-1')()?.balanceMad).toBe(41000);
  });
});
