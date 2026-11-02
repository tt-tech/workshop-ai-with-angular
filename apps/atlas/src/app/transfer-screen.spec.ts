import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FakeBackend } from '@atlas/data-access-banking';
import { appRoutes } from './app.routes';

// Pins the transfer screen by URL, not by component: the same spec runs before and after the route flip.
@Injectable()
class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
}

const open = async (url: string) => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes, withComponentInputBinding()),
      { provide: FakeBackend, useClass: InstantBackend },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  const screen = harness.routeNativeElement as HTMLElement;
  const until = (check: () => void) =>
    vi.waitFor(() => {
      harness.detectChanges();
      check();
    });
  const field = (name: string) => {
    const label = Array.from(screen.querySelectorAll('label')).find((l) =>
      l.textContent?.trim().startsWith(name),
    );
    const control = label?.htmlFor
      ? screen.querySelector(`#${label.htmlFor}`)
      : label?.querySelector('input, select');
    if (!control) throw new Error(`No field labelled "${name}"`);
    return control as HTMLInputElement;
  };
  const type = (name: string, value: string) => {
    const input = field(name);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  };
  const confirm = () => {
    screen.querySelector('form')?.dispatchEvent(new Event('submit'));
    harness.detectChanges();
  };
  await until(() => field('Amount (MAD)'));
  return { screen, type, confirm, until, router: TestBed.inject(Router) };
};

describe('/transfers/new/:accountId, pinned by URL', () => {
  it('refuses an amount above the balance with the balance message', async () => {
    const { screen, type, confirm, until, router } = await open(
      '/transfers/new/a-current',
    );
    type('Amount (MAD)', '20000');
    confirm();
    await until(() =>
      expect(screen.textContent).toContain(
        'The balance does not cover this amount.',
      ),
    );
    expect(router.url).toBe('/transfers/new/a-current');
  });

  it('moves the money and leaves the form for a valid transfer', async () => {
    const { type, confirm, until, router } = await open(
      '/transfers/new/a-current',
    );
    type('Amount (MAD)', '500');
    confirm();
    await until(() => expect(router.url).not.toBe('/transfers/new/a-current'));
    const current = (await TestBed.inject(FakeBackend).getAccounts()).find(
      (a) => a.id === 'a-current',
    );
    expect(current?.balanceMad).toBe(18142.35);
  });
});
