import { z } from 'zod';

const spendingBarSchema = z.object({ label: z.string(), amountMad: z.number() });
const transactionRowSchema = z.object({ id: z.string(), date: z.string(), label: z.string(), amountMad: z.number() });

export const stringOf = (value: unknown) => z.string().safeParse(value).data;
export const numberOf = (value: unknown) => z.number().finite().safeParse(value).data;
export const spendingBarsOf = (value: unknown) => spendingBarSchema.array().safeParse(value).data ?? [];
export const transactionRowsOf = (value: unknown) => transactionRowSchema.array().safeParse(value).data ?? [];
