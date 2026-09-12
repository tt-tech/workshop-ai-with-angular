import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlanChangeService } from './plan-change.service';

// LEGACY — frozen. This is the module-2 migration target: NgModule, *ngIf/*ngFor,
// constructor injection, manual subscriptions, `any`, no OnPush, logic in the component.
// Do not touch outside a task file that says "migrate".
@Component({
  selector: 'atlas-plan-change',
  standalone: false,
  templateUrl: './plan-change.component.html',
  styleUrls: ['./plan-change.component.scss'],
})
export class PlanChangeComponent implements OnInit, OnDestroy {
  subscriber: any = null;
  plans: any[] = [];
  selectedPlanId: string = '';
  error: string = '';
  saving = false;
  loading = true;

  private subs: Subscription[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private service: PlanChangeService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.subs.push(
      this.service.getSubscriber(id).subscribe((s) => {
        this.subscriber = s;
        this.selectedPlanId = s ? s.planId : '';
        this.loading = false;
      })
    );
    this.subs.push(this.service.getPlans().subscribe((p) => (this.plans = p)));
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onPlanSelected(event: any) {
    this.selectedPlanId = event.target.value;
    this.error = '';
  }

  canSave() {
    if (!this.subscriber) return false;
    if (this.selectedPlanId === this.subscriber.planId) return false;
    if (this.subscriber.status === 'terminated') return false;
    const target: any = this.plans.find((p) => p.id === this.selectedPlanId);
    const current: any = this.plans.find((p) => p.id === this.subscriber.planId);
    if (target && current && target.monthlyPriceMad > current.monthlyPriceMad) {
      if (this.subscriber.status === 'suspended') return false;
      if (this.subscriber.balanceMad < 0) return false;
    }
    return true;
  }

  save() {
    if (!this.canSave()) {
      this.error = 'This plan change is not allowed for this subscriber.';
      return;
    }
    this.saving = true;
    this.subs.push(
      this.service.changePlan(this.subscriber.id, this.selectedPlanId).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/subscribers', this.subscriber.id]);
        },
        error: (e: any) => {
          this.saving = false;
          this.error = e && e.message ? e.message : 'Unknown error';
        },
      })
    );
  }
}
