import { assistantComponents, categoryLabel, formatMonth, type SpendingBar } from '@atlas/domain';
import { z } from 'zod';
import { transactionsOf } from '../../bank';
import { bind, defineMacro } from '../macro';
import { accountIdSchema } from '../model-components';

export const spendingChart = defineMacro({
  args: z.object({ accountId: accountIdSchema, month: z.string().regex(/^\d{4}-\d{2}$/) }).strict(),
  description: '{"accountId", "month": "YYYY-MM"}: bars of money spent per category in that month.',
  expand: (id, args, session) => {
    const spent = new Map<string, number>();
    for (const transaction of transactionsOf(session, args.accountId)) {
      const label = categoryLabel[transaction.category];
      if (transaction.amountMad < 0 && transaction.date.startsWith(args.month)) spent.set(label, (spent.get(label) ?? 0) - transaction.amountMad);
    }
    const bars: SpendingBar[] = [...spent].map(([label, amountMad]) => ({ label, amountMad })).toSorted((left, right) => right.amountMad - left.amountMad);
    return { components: [{ id, component: assistantComponents.spendingChart, month: bind(id, 'month'), bars: bind(id, 'bars') }], data: { month: formatMonth(args.month), bars } };
  },
});
