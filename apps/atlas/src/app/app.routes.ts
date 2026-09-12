import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'subscribers' },
  { path: 'subscribers', loadChildren: () => import('@atlas/feature-subscribers').then((m) => m.subscribersRoutes) },
  { path: 'tickets', loadChildren: () => import('@atlas/feature-tickets').then((m) => m.ticketsRoutes) },
  { path: 'plans/change', loadChildren: () => import('@atlas/legacy-plans').then((m) => m.LegacyPlansModule) },
];
