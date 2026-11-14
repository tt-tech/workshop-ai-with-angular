import { assistantComponents, maskRib, showTransactions } from '@atlas/domain';
import { z } from 'zod';
import { serverId } from '../../a2ui/protocol';
import { ownAccount } from '../../bank';
import { bind, defineMacro } from '../macro';
import { accountIdSchema } from '../model-components';

export const accountSummary = defineMacro({
  args: z.object({ accountId: accountIdSchema }).strict(),
  description: '{"accountId"}: card with the name, masked number and balance of one account, plus a button to show its transactions.',
  expand: (id, args, session) => {
    const account = ownAccount(session, args.accountId);
    const [card, more, moreLabel] = [serverId(id, 'card'), serverId(id, 'more'), serverId(id, 'more_label')];
    return {
      components: [
        { id, component: 'Column', children: [card, more] },
        { id: card, component: assistantComponents.accountCard, name: bind(id, 'name'), maskedNumber: bind(id, 'maskedNumber'), balance: bind(id, 'balance') },
        { id: more, component: 'Button', variant: 'borderless', child: moreLabel, action: { event: { name: showTransactions, context: { accountId: account.id } } } },
        { id: moreLabel, component: 'Text', text: 'Show recent transactions' },
      ],
      data: { name: account.label, maskedNumber: maskRib(account.rib), balance: account.balanceMad },
    };
  },
});
