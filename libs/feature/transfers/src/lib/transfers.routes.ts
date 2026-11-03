import type { Route } from '@angular/router';
import { NewTransfer } from './new-transfer';

export const transfersRoutes: Route[] = [
  { path: 'new/:accountId', component: NewTransfer },
];
