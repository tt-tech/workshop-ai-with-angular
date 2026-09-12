import { packageById, type Account } from './models';

export type TransferBlocker = 'invalid-amount' | 'blocked-account' | 'closed-account' | 'same-account' | 'insufficient-funds' | 'over-daily-limit';

export type TransferVerdict = { readonly ok: true } | { readonly ok: false; readonly reason: TransferBlocker };

export interface TransferIntent {
  readonly from: Account;
  readonly toRib: string;
  readonly amountMad: number;
  /** Amount already transferred from this account today, in MAD. */
  readonly transferredTodayMad: number;
}

export const canTransfer = ({ from, toRib, amountMad, transferredTodayMad }: TransferIntent): TransferVerdict => {
  if (!Number.isFinite(amountMad) || amountMad <= 0) return { ok: false, reason: 'invalid-amount' };
  if (from.status === 'closed') return { ok: false, reason: 'closed-account' };
  if (from.status === 'blocked') return { ok: false, reason: 'blocked-account' };
  if (from.rib === toRib) return { ok: false, reason: 'same-account' };
  if (amountMad > from.balanceMad) return { ok: false, reason: 'insufficient-funds' };
  if (transferredTodayMad + amountMad > packageById(from.packageId).dailyTransferLimitMad) return { ok: false, reason: 'over-daily-limit' };
  return { ok: true };
};

export const blockerMessage: Record<TransferBlocker, string> = {
  'invalid-amount': 'Enter an amount above 0 MAD.',
  'blocked-account': 'This account is blocked. Contact your advisor to unblock it.',
  'closed-account': 'This account is closed.',
  'same-account': 'The destination is the same account.',
  'insufficient-funds': 'The balance does not cover this amount.',
  'over-daily-limit': 'This transfer exceeds the daily limit of your package.',
};
