import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  AccountsStore,
  CardsStore,
  FakeBackend,
} from '@atlas/data-access-banking';
import type { Account, Transaction } from '@atlas/domain';
import { AccountDetail } from './account-detail';

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
      balanceMad: 1000,
      openedOn: '2020-01-01',
    },
  ];
  protected override transactions: Transaction[] = [
    {
      id: 't-1',
      accountId: 'a-1',
      date: '2026-09-11',
      label: 'Marjane Californie',
      category: 'groceries',
      amountMad: -642.5,
    },
    {
      id: 't-2',
      accountId: 'a-1',
      date: '2026-09-10',
      label: 'Orange Maroc',
      category: 'telecom',
      amountMad: -199,
    },
    {
      id: 't-3',
      accountId: 'a-1',
      date: '2026-08-28',
      label: 'Carrefour Market',
      category: 'groceries',
      amountMad: -1388.15,
    },
  ];
}

const setup = async () => {
  TestBed.configureTestingModule({
    imports: [AccountDetail],
    providers: [
      provideRouter([]),
      { provide: FakeBackend, useClass: InstantBackend },
    ],
  });
  const fixture = TestBed.createComponent(AccountDetail);
  fixture.componentRef.setInput('id', 'a-1');
  fixture.detectChanges();
  await Promise.all([
    TestBed.inject(AccountsStore).load(),
    TestBed.inject(CardsStore).load(),
  ]);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const field = (label: string) =>
    Array.from(root.querySelectorAll('label'))
      .find((l) => l.textContent?.trim().startsWith(label))
      ?.querySelector('select') as HTMLSelectElement;
  const button = (name: string) =>
    Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === name,
    ) as HTMLButtonElement;
  const choose = (label: string, value: string) => {
    const select = field(label);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };
  return { button, choose };
};

const readText = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });

const { createObjectURL, revokeObjectURL } = URL;

const download = () => {
  const blobs: Blob[] = [];
  const names: string[] = [];
  URL.createObjectURL = (blob: Blob) => {
    blobs.push(blob);
    return 'blob:atlas/export';
  };
  URL.revokeObjectURL = () => undefined;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    names.push(this.download);
  });
  return { blobs, names };
};

describe('AccountDetail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it('exports the transactions of the selected category as a CSV file', async () => {
    const { blobs, names } = download();
    const { button, choose } = await setup();
    choose('Category', 'groceries');
    button('Export CSV').click();
    expect(names).toEqual(['a-1-transactions.csv']);
    expect(blobs[0].type).toBe('text/csv;charset=utf-8');
    expect(await readText(blobs[0])).toBe(
      'Date,Label,Category,Amount\r\n' +
        '2026-09-11,Marjane Californie,Groceries,"-642,50 MAD"\r\n' +
        '2026-08-28,Carrefour Market,Groceries,"-1 388,15 MAD"',
    );
  });
});
