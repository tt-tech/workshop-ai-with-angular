import { TestBed } from '@angular/core/testing';
import { FakeBackend } from './fake-backend';
import { SubscribersStore } from './subscribers.store';

describe('SubscribersStore', () => {
  const setup = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(SubscribersStore);
  };

  it('loads subscribers once and exposes the sorted list of cities', async () => {
    const store = setup();
    expect(store.loaded()).toBe(false);

    await store.load();
    await store.load();

    expect(store.loaded()).toBe(true);
    expect(store.subscribers().length).toBeGreaterThan(0);
    expect(store.cities()).toEqual([...store.cities()].sort());
  });

  it('reflects a plan change in the subscriber signal', async () => {
    const store = setup();
    await store.load();
    const before = store.byId('s-1001')();
    expect(before?.planId).toBe('atlas-plus');

    await store.changePlan('s-1001', 'atlas-pro');

    expect(store.byId('s-1001')()?.planId).toBe('atlas-pro');
    expect(TestBed.inject(FakeBackend)).toBeTruthy();
  });
});
