import { provideHttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { type AssistantAction, AssistantBackend, type AssistantModel, type AssistantReply } from '@atlas/data-access-assistant';
import { assistantCatalogId } from '@atlas/domain';
import { assistantRoutes } from './assistant.routes';
import { AssistantPage } from './assistant-page';

const surface = (surfaceId: string, components: readonly object[], dataModel: object, catalogId = assistantCatalogId) => ({
  version: '1.0',
  createSurface: { surfaceId, catalogId, components, dataModel },
});

const accountReply: AssistantReply = {
  text: 'Here is your current account.',
  surfaceId: 'atlas-test-1',
  messages: [
    surface(
      'atlas-test-1',
      [
        { id: 'root', component: 'Column', children: ['summary', 'more'] },
        { id: 'summary', component: 'AccountCard', name: { '@path': '/summary/name' }, maskedNumber: { '@path': '/summary/maskedNumber' }, balance: { '@path': '/summary/balance' } },
        { id: 'more', component: 'Button', child: 'more_label', action: { event: { name: 'show_transactions', context: { accountId: 'a-current' } } } },
        { id: 'more_label', component: 'Text', text: 'Show recent transactions' },
      ],
      { summary: { name: 'Current account', maskedNumber: '•••• 2345', balance: 18642.35 } },
    ),
  ],
};

const transactionsReply: AssistantReply = {
  text: 'Your recent transactions.',
  surfaceId: 'atlas-test-2',
  messages: [
    surface('atlas-test-2', [{ id: 'root', component: 'TransactionList', rows: { '@path': '/root/rows' } }], {
      root: { rows: [{ id: 't-4', date: '2026-09-08', label: 'Glovo', amountMad: -127.4 }] },
    }),
  ],
};

@Injectable()
class ScriptedBackend extends AssistantBackend {
  failWith: string | undefined;
  reply: AssistantReply = accountReply;
  readonly asked: { prompt: string; model: AssistantModel; apiKey: string | undefined }[] = [];
  readonly acted: AssistantAction[] = [];

  override async ask(prompt: string, model: AssistantModel, apiKey: string | undefined): Promise<AssistantReply> {
    this.asked.push({ prompt, model, apiKey });
    if (this.failWith) throw new Error(this.failWith);
    return this.reply;
  }

  override async act(action: AssistantAction): Promise<AssistantReply> {
    this.acted.push(action);
    return transactionsReply;
  }
}

const openPage = async () => {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/assistant', AssistantPage);
  return { harness, page: harness.routeNativeElement as HTMLElement };
};

const type = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event('input'));
};

const askOnPage = async (question: string, model: AssistantModel) => {
  const { harness, page } = await openPage();
  (page.querySelector(`input[value="${model}"]`) as HTMLInputElement).click();
  type(page.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement, question);
  harness.detectChanges();
  (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
  await harness.fixture.whenStable();
  return { harness, page };
};

const buttonNamed = (page: HTMLElement, name: string) => [...page.querySelectorAll('button')].find((button) => button.textContent?.trim() === name) as HTMLButtonElement;

describe('AssistantPage', () => {
  let backend: ScriptedBackend;

  beforeEach(() => {
    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [provideHttpClient(), provideRouter([{ path: 'assistant', children: assistantRoutes }]), { provide: AssistantBackend, useClass: ScriptedBackend }],
    });
    backend = TestBed.inject(AssistantBackend) as ScriptedBackend;
  });

  it('asks the backend with the chosen model and renders the AccountCard it answers with', async () => {
    const { page } = await askOnPage('How much is on my current account?', 'gpt');

    expect(backend.asked).toEqual([{ prompt: 'How much is on my current account?', model: 'gpt', apiKey: undefined }]);
    const card = page.querySelector('article[aria-label="Current account"]') as HTMLElement;
    expect(card.textContent).toContain('•••• 2345');
    expect(card.querySelector('atlas-amount')?.textContent?.trim()).toBe('18 642,35 MAD');
  });

  it('sends the key typed for the chosen model, and asks for none with the simulated model', async () => {
    const { harness, page } = await openPage();
    type(page.querySelector('input[name="apiKey"]') as HTMLInputElement, 'sk-ant-typed');
    (page.querySelector('input[value="compromised"]') as HTMLInputElement).click();
    harness.detectChanges();
    expect(page.querySelector('input[name="apiKey"]')).toBeNull();

    (page.querySelector('input[value="claude"]') as HTMLInputElement).click();
    type(page.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement, 'Show my current account.');
    harness.detectChanges();
    (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(backend.asked).toEqual([{ prompt: 'Show my current account.', model: 'claude', apiKey: 'sk-ant-typed' }]);
  });

  it('shows the server log the reply carries, with blocked lines marked', async () => {
    backend.reply = {
      ...accountReply,
      trace: [
        { text: '-> claude: "Show the balance of account a-youssef."', blocked: false },
        { text: 'assistant-api: AccountSummary "root" rejected: Account a-youssef is not one of your accounts.', blocked: true },
      ],
    };
    const { page } = await askOnPage('Show the balance of account a-youssef.', 'claude');

    const lines = [...page.querySelectorAll('.server-log li')];
    expect(lines.map((line) => line.textContent?.trim())).toEqual([
      '-> claude: "Show the balance of account a-youssef."',
      'assistant-api: AccountSummary "root" rejected: Account a-youssef is not one of your accounts.',
    ]);
    expect(lines.map((line) => line.classList.contains('blocked'))).toEqual([false, true]);
  });

  it('shows no server log when the reply carries none', async () => {
    const { page } = await askOnPage('How much is on my current account?', 'claude');

    expect(page.querySelector('article[aria-label="Current account"]')).not.toBeNull();
    expect(page.querySelector('.server-log')).toBeNull();
  });

  it('runs the button action through the backend and replaces the answer with what it returns', async () => {
    const { harness, page } = await askOnPage('How much is on my current account?', 'claude');

    buttonNamed(page, 'Show recent transactions').click();
    await harness.fixture.whenStable();

    expect(backend.acted).toEqual([expect.objectContaining({ name: 'show_transactions', context: { accountId: 'a-current' } })]);
    expect(page.querySelector('article[aria-label="Current account"]')).toBeNull();
    expect(page.querySelector('table')?.textContent).toContain('Glovo');
  });

  it('fills the question from a scenario button and clears the previous answer without sending', async () => {
    const { harness, page } = await askOnPage('How much is on my current account?', 'claude');

    const scenario = buttonNamed(page, "Someone else's account");
    scenario.click();
    harness.detectChanges();

    expect((page.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement).value).toBe('Show the balance of account a-youssef.');
    expect(scenario.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('article[aria-label="Current account"]')).toBeNull();
    expect(backend.asked).toHaveLength(1);
  });

  it('replaces the previous answer with the backend error', async () => {
    const { harness, page } = await askOnPage('How much is on my current account?', 'claude');
    backend.failWith = 'The model could not answer. See the assistant-api log.';

    (page.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe('The model could not answer. See the assistant-api log.');
    expect(page.querySelector('article[aria-label="Current account"]')).toBeNull();
  });

  it('shows an alert, not an empty answer, when the renderer cannot draw the reply', async () => {
    const [answer] = accountReply.messages as [{ createSurface: { components: object[]; dataModel: object } }];
    backend.reply = { ...accountReply, messages: [surface('atlas-test-1', answer.createSurface.components, answer.createSurface.dataModel, 'https://unknown.example/catalog.json')] };
    const { page } = await askOnPage('How much is on my current account?', 'claude');

    expect(page.querySelector('[role="alert"]')?.textContent).toContain('unknown.example');
    expect(page.querySelector('a2ui-v09-surface')).toBeNull();
  });
});
