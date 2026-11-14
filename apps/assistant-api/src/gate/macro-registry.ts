import { accountSummary } from './macros/account-summary';
import { recentTransactions } from './macros/recent-transactions';
import { spendingChart } from './macros/spending-chart';

export const macros = {
  AccountSummary: accountSummary,
  SpendingChart: spendingChart,
  RecentTransactions: recentTransactions,
} as const;

export type MacroName = keyof typeof macros;
export const isMacro = (name: string): name is MacroName => Object.hasOwn(macros, name);

export const macroCatalog = Object.entries(macros)
  .map(([name, macro]) => `- ${name} ${macro.description}`)
  .join('\n');
