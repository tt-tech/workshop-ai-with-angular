import angular from 'angular';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';
import type { Account, Beneficiary, Transaction } from '@atlas/domain';
import { BeneficiariesHost } from './beneficiaries-host';

// Task 006: the hybrid screen, rendered for real: Angular bootstraps AngularJS, AngularJS renders the downgraded <atlas-amount>.
// Only the boundary (FakeBackend) is replaced, with an instant one.
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
      packageId: 'atlas-confort',
      balanceMad: 20000,
      openedOn: '2020-01-01',
    },
  ];
  protected override transactions: Transaction[] = [
    {
      id: 't-1',
      accountId: 'a-1',
      date: '2026-09-02',
      label: 'Virement vers Savings',
      category: 'transfer',
      amountMad: -3000,
    },
    {
      id: 't-2',
      accountId: 'a-1',
      date: '2026-09-03',
      label: 'Virement vers 8765',
      category: 'transfer',
      amountMad: -250,
    },
    {
      id: 't-3',
      accountId: 'a-1',
      date: '2026-09-01',
      label: 'Salaire',
      category: 'salary',
      amountMad: 21500,
    },
  ];
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

const angularJsStable = (element: Element): Promise<void> =>
  new Promise((resolve) =>
    angular
      .element(element)
      .injector()
      .get('$browser')
      .notifyWhenNoOutstandingRequests(resolve),
  );

const setup = async () => {
  TestBed.configureTestingModule({
    imports: [BeneficiariesHost],
    providers: [
      provideRouter([{ path: 'transfers/new/:accountId', children: [] }]),
      { provide: FakeBackend, useClass: InstantBackend },
    ],
  });
  const fixture = TestBed.createComponent(BeneficiariesHost);
  await fixture.whenStable(); // afterNextRender bootstraps AngularJS, which starts the load
  await TestBed.inject(AccountsStore).load();
  const root = fixture.nativeElement.querySelector('.lb-root') as HTMLElement;
  await angularJsStable(root);
  return { fixture, root };
};

const rowNames = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('tbody tr[id]')).map((r) =>
    r.querySelector('td')?.textContent?.trim(),
  );

const type = (root: HTMLElement, selector: string, value: string) => {
  const input = root.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('BeneficiariesHost (AngularJS inside Angular)', () => {
  it('lists every beneficiary with its RIB and the amount sent, rendered by the downgraded <atlas-amount>', async () => {
    const { root } = await setup();
    const rows = Array.from(
      root.querySelectorAll('tbody tr[id]'),
    ) as HTMLElement[];
    expect(rowNames(root)).toEqual(['Savings', 'Youssef Idrissi']);
    expect(rows[0].textContent).toContain('007 780 0001234567890543 21');
    expect(
      rows.map((r) => r.querySelector('atlas-amount')?.textContent?.trim()),
    ).toEqual(['-3 000,00 MAD', '-250,00 MAD']);
  });

  // TODO 006: looks wrong because the header formats MAD with $filter('number') (en-US grouping) while the rows use formatMad.
  it('shows the count and the total sent in the header', async () => {
    const { root } = await setup();
    expect(root.querySelector('.lb-header')?.textContent).toContain(
      '2 beneficiaries · 3,250.00 MAD sent',
    );
  });

  it('narrows the list to the beneficiaries matching the search', async () => {
    const { root } = await setup();
    type(root, '#lb-search', 'populaire');
    expect(rowNames(root)).toEqual(['Youssef Idrissi']);
  });

  it('rejects a RIB that does not have 24 digits', async () => {
    const { root } = await setup();
    type(root, '#lb-name', 'Hamza Tazi');
    type(root, '#lb-rib', '0117800009');
    (
      root.querySelector('form button[type=submit]') as HTMLButtonElement
    ).click();
    await angularJsStable(root);
    expect(root.querySelector('[role=alert]')?.textContent?.trim()).toBe(
      'A RIB has 24 digits.',
    );
    expect(root.querySelector('.lb-pending')).toBeNull();
  });

  it('puts a valid new beneficiary on the activation list', async () => {
    const { root } = await setup();
    type(root, '#lb-name', 'Hamza Tazi');
    type(root, '#lb-rib', '230 780 0001122334455667 78');
    (
      root.querySelector('form button[type=submit]') as HTMLButtonElement
    ).click();
    await angularJsStable(root);
    expect(root.querySelector('.lb-pending')?.textContent).toContain(
      'Hamza Tazi · Other bank',
    );
    expect(root.querySelector('.lb-header')?.textContent).toContain(
      '3 beneficiaries',
    );
  });

  it('opens the transfer form of the current account from "Send money"', async () => {
    const { fixture, root } = await setup();
    (root.querySelector('tbody tr[id] button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/transfers/new/a-1');
  });
});
