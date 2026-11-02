import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders the main navigation', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a:not(.brand)'),
    ).map((a) => (a as HTMLElement).textContent?.trim());
    expect(links).toEqual([
      'Overview',
      'Accounts',
      'Requests',
      'Beneficiaries',
    ]);
  });
});
