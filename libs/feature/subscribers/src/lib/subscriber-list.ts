import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatMsisdn, planById } from '@atlas/domain';
import { SubscribersStore } from '@atlas/data-access-subscribers';
import { PageHeader, StatusBadge } from '@atlas/ui';

const allCities = 'all';

@Component({
  selector: 'atlas-subscriber-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, StatusBadge],
  template: `
    <atlas-page-header title="Subscribers" subtitle="Atlas Telecom · atlas back office">
      <label>
        City
        <select (change)="city.set($any($event.target).value)">
          <option [value]="allCitiesOption">All</option>
          @for (c of store.cities(); track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </label>
    </atlas-page-header>

    @if (store.loading()) {
      <p class="muted">Loading subscribers…</p>
    } @else {
      <table class="table">
        <thead>
          <tr><th>Name</th><th>MSISDN</th><th>City</th><th>Plan</th><th>Status</th><th>Balance</th></tr>
        </thead>
        <tbody>
          @for (s of filtered(); track s.id) {
            <tr>
              <td><a [routerLink]="[s.id]">{{ s.firstName }} {{ s.lastName }}</a></td>
              <td>{{ formatMsisdn(s.msisdn) }}</td>
              <td>{{ s.city }}</td>
              <td>{{ planById(s.planId).name }}</td>
              <td><atlas-status-badge [status]="s.status" /></td>
              <td [class.negative]="s.balanceMad < 0">{{ s.balanceMad }} MAD</td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted">No subscribers in this city.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e6e9ef; }
    th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #5a6270; }
    .negative { color: #b42318; font-weight: 600; }
    .muted { color: #5a6270; }
  `,
})
export class SubscriberList implements OnInit {
  protected readonly store = inject(SubscribersStore);
  protected readonly city = signal<string>(allCities);
  protected readonly allCitiesOption = allCities;
  protected readonly formatMsisdn = formatMsisdn;
  protected readonly planById = planById;

  protected readonly filtered = computed(() => {
    const city = this.city();
    const all = this.store.subscribers();
    return city === allCities ? all : all.filter((s) => s.city === city);
  });

  ngOnInit(): void {
    void this.store.load();
  }
}
