/** The A2UI catalog the assistant page renders and the assistant server writes for. */
export const assistantCatalogId = 'https://atlas-bank.example/a2ui/catalogs/assistant/v1.json';

/** Atlas components the server places on an assistant surface; the page registers one implementation each. */
export const assistantComponents = {
  accountCard: 'AccountCard',
  spendingChart: 'SpendingChart',
  transactionList: 'TransactionList',
  blockedNotice: 'BlockedNotice',
} as const;

/** The only action an assistant surface can raise. */
export const showTransactions = 'show_transactions';

export interface SpendingBar {
  readonly label: string;
  readonly amountMad: number;
}

export interface TransactionRow {
  readonly id: string;
  readonly date: string;
  readonly label: string;
  readonly amountMad: number;
}

/** One line of the server's trace for a request, sent with the reply only when the server runs with ATLAS_SHOW_TRACE=1. */
export interface ServerTraceLine {
  readonly text: string;
  readonly blocked: boolean;
}
