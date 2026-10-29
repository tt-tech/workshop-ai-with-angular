import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AccountsStore, FakeBackend, RatesStore } from '@atlas/data-access-banking';
import type { Transaction } from '@atlas/domain';
import { TransferReceipt } from './transfer-receipt';

class InstantBackend extends FakeBackend {
  protected override readonly latencyMs = 0;
  protected override transactions: Transaction[] = [
    { id: 't-9', accountId: 'a-current', date: '2026-10-29', label: 'Loyer **octobre** <img src=x onerror=alert(1)>', category: 'transfer', amountMad: -1500 },
  ];
}

const setup = async () => {
  TestBed.configureTestingModule({
    imports: [TransferReceipt],
    providers: [provideRouter([], withComponentInputBinding()), { provide: FakeBackend, useClass: InstantBackend }],
  });
  const fixture = TestBed.createComponent(TransferReceipt);
  fixture.componentRef.setInput('txId', 't-9');
  fixture.detectChanges();
  await TestBed.inject(AccountsStore).load();
  await TestBed.inject(RatesStore).load();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('TransferReceipt', () => {
  it('renders the label as text with bold segments, never as markup', async () => {
    const el = await setup();
    const label = el.querySelector('.label') as HTMLElement;
    expect(label.querySelector('b')?.textContent).toBe('octobre');
    expect(label.querySelector('img')).toBeNull();
    expect(label.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('shows the EUR equivalent from the backend rate', async () => {
    const el = await setup();
    expect(el.textContent).toContain('1 500,00 MAD');
    expect(el.textContent).toContain('≈ 138.00 EUR');
  });
});
