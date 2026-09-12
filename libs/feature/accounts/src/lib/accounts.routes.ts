import type { Route } from '@angular/router';
import { AccountList } from './account-list';
import { AccountDetail } from './account-detail';

export const accountsRoutes: Route[] = [
  { path: '', component: AccountList },
  { path: ':id', component: AccountDetail },
];
