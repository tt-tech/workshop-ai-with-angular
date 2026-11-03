import type { Route } from '@angular/router';
import { BeneficiaryList } from './beneficiary-list';

export const beneficiariesRoutes: Route[] = [
  { path: '', component: BeneficiaryList },
];
