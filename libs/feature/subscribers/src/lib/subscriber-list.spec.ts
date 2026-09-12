import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FakeBackend } from '@atlas/data-access-subscribers';
import { SubscriberList } from './subscriber-list';

// Sociable test: the real store participates; only the boundary (FakeBackend) is replaced.
class InstantBackend extends FakeBackend {
  override async getSubscribers() {
    return [
      { id: 's-1', msisdn: '212612345678', firstName: 'Salma', lastName: 'Idrissi', city: 'Casablanca', planId: 'atlas-plus' as const, status: 'active' as const, contractStart: '2024-03-01', balanceMad: 0 },
      { id: 's-2', msisdn: '212661234567', firstName: 'Youssef', lastName: 'Benali', city: 'Rabat', planId: 'atlas-pro' as const, status: 'active' as const, contractStart: '2023-11-15', balanceMad: -85 },
    ];
  }
}

const setup = async () => {
  TestBed.configureTestingModule({
    imports: [SubscriberList],
    providers: [provideRouter([]), { provide: FakeBackend, useClass: InstantBackend }],
  });
  const fixture = TestBed.createComponent(SubscriberList);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
};

const rowNames = (fixture: { nativeElement: HTMLElement }) =>
  Array.from(fixture.nativeElement.querySelectorAll('tbody tr td:first-child')).map((td) => td.textContent?.trim());

describe('SubscriberList', () => {
  it('shows every subscriber after loading', async () => {
    const fixture = await setup();
    expect(rowNames(fixture)).toEqual(['Salma Idrissi', 'Youssef Benali']);
  });

  it('filters the table by city', async () => {
    const fixture = await setup();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'Rabat';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(rowNames(fixture)).toEqual(['Youssef Benali']);
  });
});
