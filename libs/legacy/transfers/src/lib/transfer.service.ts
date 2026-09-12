import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountsStore, FakeBackend } from '@atlas/data-access-banking';

// LEGACY — frozen. Wraps the modern store behind the Observable API the old component expects.
@Injectable()
export class TransferService {
  constructor(private backend: FakeBackend, private store: AccountsStore) {}

  getAccount(id: string): Observable<any> {
    return from(this.backend.getAccounts()).pipe(map((all) => all.find((a) => a.id === id) || null));
  }

  getBeneficiaries(): Observable<any[]> {
    return from(this.backend.getBeneficiaries());
  }

  transfer(accountId: string, toRib: string, amount: number, label: string): Observable<void> {
    return from(this.store.transfer(accountId, toRib, amount, label));
  }
}
