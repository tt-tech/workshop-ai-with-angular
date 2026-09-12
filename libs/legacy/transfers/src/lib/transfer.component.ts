import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TransferService } from './transfer.service';

// LEGACY — frozen. This is the module-2 migration target: NgModule, *ngIf/*ngFor,
// constructor injection, manual subscriptions + markForCheck, `any`, business rules duplicated in the component.
// Do not touch outside a task file that says "migrate".
@Component({
  selector: 'atlas-transfer',
  standalone: false,
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss'],
})
export class TransferComponent implements OnInit, OnDestroy {
  account: any = null;
  beneficiaries: any[] = [];
  selectedRib: string = '';
  amount: number = 0;
  label: string = '';
  error: string = '';
  saving = false;
  loading = true;

  private subs: Subscription[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private service: TransferService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('accountId') || '';
    this.subs.push(
      this.service.getAccount(id).subscribe((a) => {
        this.account = a;
        this.loading = false;
        this.cdr.markForCheck();
      })
    );
    this.subs.push(
      this.service.getBeneficiaries().subscribe((b) => {
        this.beneficiaries = b;
        if (b.length > 0) this.selectedRib = b[0].rib;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onBeneficiary(event: any) {
    this.selectedRib = event.target.value;
    this.error = '';
  }

  onAmount(event: any) {
    this.amount = parseFloat(event.target.value) || 0;
    this.error = '';
  }

  onLabel(event: any) {
    this.label = event.target.value;
  }

  validate(): string {
    if (!this.account) return 'No account.';
    if (!(this.amount > 0)) return 'Enter an amount above 0 MAD.';
    if (this.account.status === 'closed') return 'This account is closed.';
    if (this.account.status === 'blocked') return 'This account is blocked. Contact your advisor to unblock it.';
    if (this.account.rib === this.selectedRib) return 'The destination is the same account.';
    if (this.amount > this.account.balanceMad) return 'The balance does not cover this amount.';
    const limits: any = { 'atlas-essentiel': 10000, 'atlas-confort': 50000, 'atlas-premium': 200000 };
    if (this.amount > limits[this.account.packageId]) return 'This transfer exceeds the daily limit of your package.';
    return '';
  }

  submit() {
    this.error = this.validate();
    if (this.error) return;
    this.saving = true;
    this.subs.push(
      this.service.transfer(this.account.id, this.selectedRib, this.amount, this.label).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/accounts', this.account.id]);
        },
        error: (e: any) => {
          this.saving = false;
          this.error = e && e.message ? e.message : 'Unknown error';
          this.cdr.markForCheck();
        },
      })
    );
  }
}
