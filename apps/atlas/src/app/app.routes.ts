import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', loadChildren: () => import('@atlas/feature-dashboard').then((m) => m.dashboardRoutes) },
  { path: 'accounts', loadChildren: () => import('@atlas/feature-accounts').then((m) => m.accountsRoutes) },
  { path: 'requests', loadChildren: () => import('@atlas/feature-requests').then((m) => m.requestsRoutes) },
  { path: 'beneficiaries', loadChildren: () => import('@atlas/angularjs-beneficiaries').then((m) => m.beneficiariesRoutes) },
  { path: 'transfers', loadChildren: () => import('@atlas/feature-transfers').then((m) => m.transfersRoutes) },
];
