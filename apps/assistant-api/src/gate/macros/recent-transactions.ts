import { assistantComponents, type TransactionRow } from '@atlas/domain';
import { z } from 'zod';
import { transactionsOf } from '../../bank';
import { bind, defineMacro } from '../macro';
import { accountIdSchema } from '../model-components';

const maxTransactions = 10;

export const recentTransactions = defineMacro({
  args: z.object({ accountId: accountIdSchema, limit: z.number().int().min(1).max(maxTransactions) }).strict(),
  description: `{"accountId", "limit": 1-${maxTransactions}}: the latest transactions of one account.`,
  expand: (id, args, session) => {
    const rows: TransactionRow[] = transactionsOf(session, args.accountId)
      .slice(0, args.limit)
      .map(({ id: rowId, date, label, amountMad }) => ({ id: rowId, date, label, amountMad }));
    return { components: [{ id, component: assistantComponents.transactionList, rows: bind(id, 'rows') }], data: { rows } };
  },
});
