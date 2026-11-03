import type { Route } from '@angular/router';
import { NewTransfer } from './new-transfer';
import { TransferReceipt } from './transfer-receipt';

export const transfersRoutes: Route[] = [
  { path: 'new/:accountId', component: NewTransfer },
  { path: 'receipt/:txId', component: TransferReceipt },
];
