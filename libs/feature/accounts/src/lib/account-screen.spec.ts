import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FakeBackend } from '@atlas/data-access-banking';
import { accountsRoutes } from './accounts.routes';

// Pins the account page by URL and reads it by role and name, never by class.
@Injectable()
class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
}

const open = async (url: string) => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [{ path: 'accounts', children: accountsRoutes }],
        withComponentInputBinding(),
      ),
      { provide: FakeBackend, useClass: InstantBackend },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  const screen = harness.routeNativeElement as HTMLElement;
  await vi.waitFor(() => {
    harness.detectChanges();
    expect(screen.querySelector('h1')).not.toBeNull();
  });
  const transferLink = () =>
    Array.from(screen.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Make a transfer',
    );
  return { screen, transferLink };
};

describe('/accounts/:id, pinned by URL', () => {
  it('explains a blocked account and does not offer a transfer', async () => {
    const { screen, transferLink } = await open('/accounts/a-joint');
    expect(screen.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'This account is blocked. Contact your advisor to unblock it.',
    );
    expect(transferLink()).toBeUndefined();
  });

  it('offers a transfer on an active account, without a banner', async () => {
    const { screen, transferLink } = await open('/accounts/a-current');
    expect(transferLink()).toBeDefined();
    expect(screen.querySelector('[role="status"]')).toBeNull();
  });
});
