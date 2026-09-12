import type { Route } from '@angular/router';
import { SubscriberList } from './subscriber-list';
import { SubscriberDetail } from './subscriber-detail';

export const subscribersRoutes: Route[] = [
  { path: '', component: SubscriberList },
  { path: ':id', component: SubscriberDetail },
];
