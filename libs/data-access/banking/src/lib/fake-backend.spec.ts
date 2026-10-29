import { TestBed } from '@angular/core/testing';
import { FakeBackend } from './fake-backend';

// The boundary enforces the business rule. The client check is for the user; this one is for real.
describe('FakeBackend.transfer', () => {
  const setup = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(FakeBackend);
  };

  it('rejects a transfer the rules forbid with the domain message, whatever the client said', async () => {
    const backend = setup();
    await expect(backend.transfer('a-current', '011780000987654321098765', 20000, 'client said it was fine')).rejects.toThrow(
      'The balance does not cover this amount.',
    );
    const accounts = await backend.getAccounts();
    expect(accounts.find((a) => a.id === 'a-current')?.balanceMad).toBe(18642.35);
  });

  it('accepts a transfer inside the rules', async () => {
    const backend = setup();
    const created = await backend.transfer('a-current', '011780000987654321098765', 500, 'ok');
    expect(created.amountMad).toBe(-500);
  });
});
