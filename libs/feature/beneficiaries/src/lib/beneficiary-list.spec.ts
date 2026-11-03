import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';
import type { Account, Beneficiary, Transaction } from '@atlas/domain';
import { BeneficiaryList } from './beneficiary-list';

// Same data and requirements as the pinned hybrid spec in libs/angularjs/beneficiaries.
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

@Injectable()
class BackendWithNewcomer extends InstantBackend {
  protected override beneficiaries: Beneficiary[] = [
    ...this.beneficiaries,
    {
      id: 'b-3',
      name: 'Amine Berrada',
      rib: '230780000556677889900112',
      bank: 'CIH Bank',
    },
  ];
}

const setup = async (backend: typeof InstantBackend = InstantBackend) => {
  TestBed.configureTestingModule({
    imports: [BeneficiaryList],
    providers: [
      provideRouter([{ path: 'transfers/new/:accountId', children: [] }]),
      { provide: FakeBackend, useClass: backend },
    ],
  });
  const fixture = TestBed.createComponent(BeneficiaryList);
  fixture.detectChanges();
  await TestBed.inject(AccountsStore).load();
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;

  const field = (label: string) => {
    const labelled = root.querySelector(`[aria-label="${label}"]`);
    const wrapping = Array.from(root.querySelectorAll('label')).find(
      (l) => l.textContent?.trim() === label,
    );
    return (labelled ?? wrapping?.querySelector('input')) as HTMLInputElement;
  };
  const button = (name: string) =>
    Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === name,
    ) as HTMLButtonElement;
  const type = (label: string, value: string) => {
    const input = field(label);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const click = (name: string) => {
    button(name).click();
    fixture.detectChanges();
  };
  const rowNames = () =>
    Array.from(root.querySelectorAll('tbody tr')).map((r) =>
      r.querySelector('td')?.textContent?.trim(),
    );
  const header = () => root.querySelector('header')?.textContent ?? '';
  const pending = () =>
    Array.from(root.querySelectorAll('h2'))
      .find((h) => h.textContent?.trim() === 'Waiting for activation')
      ?.closest('section')?.textContent ?? '';
  const alert = () => root.querySelector('[role=alert]')?.textContent?.trim();

  return {
    fixture,
    root,
    field,
    type,
    click,
    rowNames,
    header,
    pending,
    alert,
  };
};

describe('BeneficiaryList', () => {
  it('lists every beneficiary with its RIB and the amount sent', async () => {
    const { root, rowNames } = await setup();
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rowNames()).toEqual(['Savings', 'Youssef Idrissi']);
    expect(rows[0].textContent).toContain('007 780 0001234567890543 21');
    expect(
      rows.map((r) => r.querySelector('atlas-amount')?.textContent?.trim()),
    ).toEqual(['-3 000,00 MAD', '-250,00 MAD']);
  });

  it('shows the count and the total sent in the header, in MAD format', async () => {
    const { header } = await setup();
    expect(header()).toContain('2 beneficiaries · 3 250,00 MAD sent');
  });

  it('narrows the list to the beneficiaries matching the search', async () => {
    const { type, rowNames } = await setup();
    type('Search beneficiaries', 'populaire');
    expect(rowNames()).toEqual(['Youssef Idrissi']);
  });

  it('says so when no beneficiary matches the search', async () => {
    const { type, rowNames } = await setup();
    type('Search beneficiaries', 'wafa');
    expect(rowNames()).toEqual(['No beneficiary matches "wafa".']);
  });

  it('sorts by most sent, then back by name', async () => {
    const { click, rowNames } = await setup(BackendWithNewcomer);
    click('Sort: Name');
    expect(rowNames()).toEqual(['Savings', 'Youssef Idrissi', 'Amine Berrada']);
    click('Sort: Most sent');
    expect(rowNames()).toEqual(['Amine Berrada', 'Savings', 'Youssef Idrissi']);
  });

  it('rejects a RIB that does not have 24 digits', async () => {
    const { type, click, alert, pending, field } = await setup();
    type('Name', 'Hamza Tazi');
    type('RIB', '0117800009');
    click('Add beneficiary');
    expect(alert()).toBe('A RIB has 24 digits.');
    expect(pending()).toBe('');
    expect(document.activeElement).toBe(field('RIB'));
  });

  it('rejects a beneficiary that already exists', async () => {
    const { type, click, alert } = await setup();
    type('Name', 'Youssef');
    type('RIB', '011780000987654321098765');
    click('Add beneficiary');
    expect(alert()).toBe('This beneficiary already exists.');
  });

  it('clears the message as soon as the customer edits the form', async () => {
    const { type, click, alert } = await setup();
    click('Add beneficiary');
    expect(alert()).toBe('Enter the beneficiary name.');
    type('Name', 'H');
    expect(alert()).toBeUndefined();
  });

  it('puts a valid new beneficiary on the activation list', async () => {
    const { type, click, header, pending, field } = await setup();
    type('Name', 'Hamza Tazi');
    type('RIB', '230 780 0001122334455667 78');
    click('Add beneficiary');
    expect(pending()).toContain('Hamza Tazi · Other bank');
    expect(pending()).toContain('230 780 0001122334455667 78');
    expect(header()).toContain('3 beneficiaries');
    expect(field('Name').value).toBe('');
    expect(field('RIB').value).toBe('');
  });

  it('opens the transfer form of the current account from "Send money"', async () => {
    const { fixture, root } = await setup();
    (root.querySelector('tbody tr button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/transfers/new/a-1');
  });
});
