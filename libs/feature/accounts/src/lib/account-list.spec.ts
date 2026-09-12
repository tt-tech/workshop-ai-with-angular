import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';
import type { Account } from '@atlas/domain';
import { AccountList } from './account-list';

// Sociable test: the real store participates; only the boundary (FakeBackend) is replaced.
class InstantBackend extends FakeBackend {
  override async getAccounts(): Promise<Account[]> {
    return [
      { id: 'a-1', rib: '007780000123456789012345', label: 'Current account', type: 'current', status: 'active', packageId: 'atlas-confort', balanceMad: 1000, openedOn: '2020-01-01' },
      { id: 'a-2', rib: '007780000123456789054321', label: 'Savings', type: 'savings', status: 'blocked', packageId: 'atlas-essentiel', balanceMad: 250.5, openedOn: '2022-05-05' },
    ];
  }
  override async getTransactions() {
    return [];
  }
  override async getBeneficiaries() {
    return [];
  }
}

const setup = async () => {
  TestBed.configureTestingModule({
    imports: [AccountList],
    providers: [provideRouter([]), { provide: FakeBackend, useClass: InstantBackend }],
  });
  const fixture = TestBed.createComponent(AccountList);
  fixture.detectChanges(); // ngOnInit starts the load
  await TestBed.inject(AccountsStore).load(); // same in-flight promise, resolves when data is in the store
  fixture.detectChanges();
  return fixture;
};

describe('AccountList', () => {
  it('lists every account with its formatted RIB', async () => {
    const fixture = await setup();
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
    expect(rows.map((r) => r.querySelector('a')?.textContent?.trim())).toEqual(['Current account', 'Savings']);
    expect(rows[0].textContent).toContain('007 780 0001234567890123 45');
  });

  it('shows the total balance in the header', async () => {
    const fixture = await setup();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 250,50');
  });
});
