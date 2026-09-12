import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plans } from '@atlas/domain';
import { FakeBackend, SubscribersStore } from '@atlas/data-access-subscribers';

// LEGACY — frozen. Wraps the modern store behind the Observable API the old component expects.
@Injectable()
export class PlanChangeService {
  constructor(private backend: FakeBackend, private store: SubscribersStore) {}

  getSubscriber(id: string): Observable<any> {
    return from(this.backend.getSubscribers()).pipe(map((all) => all.find((s) => s.id === id) || null));
  }

  getPlans(): Observable<any[]> {
    return from(Promise.resolve([...plans]));
  }

  changePlan(subscriberId: string, planId: string): Observable<void> {
    return from(this.store.changePlan(subscriberId, planId as any));
  }
}
