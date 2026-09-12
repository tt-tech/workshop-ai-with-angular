import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlanChangeComponent } from './plan-change.component';
import { PlanChangeService } from './plan-change.service';

// LEGACY — frozen. Routed NgModule, the shape most enterprise Angular apps still carry.
@NgModule({
  imports: [CommonModule, RouterModule.forChild([{ path: ':id', component: PlanChangeComponent }])],
  declarations: [PlanChangeComponent],
  providers: [PlanChangeService],
})
export class LegacyPlansModule {}
