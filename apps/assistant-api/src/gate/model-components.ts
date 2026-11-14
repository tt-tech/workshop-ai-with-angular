import { showTransactions } from '@atlas/domain';
import { z } from 'zod';
import { idSchema } from '../a2ui/protocol';

const maxTextLength = 300;
export const accountIdSchema = z.string().regex(/^a-[a-z]{1,30}$/);
export const showTransactionsEvent = z.object({ name: z.literal(showTransactions), context: z.object({ accountId: accountIdSchema }).strict() }).strict();

export const hasFigure = (text: string) => /[\p{N}\p{Sc}]/u.test(text.normalize('NFKC').replace(/\p{Cf}/gu, ''));
export const figureRule = { message: 'numbers only come from macros', params: { figure: true } };
const literalText = z.string().max(maxTextLength).refine((text) => !hasFigure(text), figureRule);

const layout = {
  children: z.array(idSchema),
  justify: z.enum(['start', 'center', 'end', 'spaceBetween', 'spaceAround', 'spaceEvenly', 'stretch']).optional(),
  align: z.enum(['center', 'end', 'start', 'stretch']).optional(),
};

export const modelComponents = {
  Column: z.object(layout).strict(),
  Row: z.object(layout).strict(),
  Card: z.object({ child: idSchema }).strict(),
  Text: z.object({ text: literalText, variant: z.enum(['caption', 'body']).optional() }).strict(),
  Divider: z.object({ axis: z.enum(['horizontal', 'vertical']).optional() }).strict(),
  Button: z
    .object({
      child: idSchema,
      variant: z.enum(['default', 'primary', 'borderless']).optional(),
      action: z.object({ event: showTransactionsEvent }).strict(),
    })
    .strict(),
};

export type ModelComponentName = keyof typeof modelComponents;
export const modelComponentNames = Object.keys(modelComponents);
export const isModelComponent = (name: string): name is ModelComponentName => Object.hasOwn(modelComponents, name);
