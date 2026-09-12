import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatMsisdn, planById } from '@atlas/domain';
import { SubscribersStore, TicketsStore } from '@atlas/data-access-subscribers';
import { PageHeader, StatusBadge } from '@atlas/ui';

@Component({
  selector: 'atlas-subscriber-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, StatusBadge],
  template: `
    @let s = subscriber();
    @if (s) {
      <atlas-page-header [title]="s.firstName + ' ' + s.lastName" [subtitle]="formatMsisdn(s.msisdn)">
        <a class="button" [routerLink]="['/plans/change', s.id]">Change plan (legacy)</a>
      </atlas-page-header>

      <dl class="facts">
        <dt>Status</dt><dd><atlas-status-badge [status]="s.status" /></dd>
        <dt>City</dt><dd>{{ s.city }}</dd>
        <dt>Plan</dt><dd>{{ plan().name }} · {{ plan().dataGb }} GB · {{ plan().monthlyPriceMad }} MAD/month</dd>
        <dt>Contract since</dt><dd>{{ s.contractStart }}</dd>
        <dt>Balance</dt><dd [class.negative]="s.balanceMad < 0">{{ s.balanceMad }} MAD</dd>
      </dl>

      <h2>Tickets</h2>
      @for (t of tickets(); track t.id) {
        <p><atlas-status-badge [status]="t.status" /> {{ t.subject }} <span class="muted">· {{ t.category }} · {{ t.createdAt }}</span></p>
      } @empty {
        <p class="muted">No tickets for this subscriber.</p>
      }
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
  styles: `
    .facts { display: grid; grid-template-columns: 10rem 1fr; row-gap: 0.5rem; }
    dt { color: #5a6270; }
    dd { margin: 0; }
    .negative { color: #b42318; font-weight: 600; }
    .muted { color: #5a6270; }
    .button { padding: 0.5rem 0.9rem; border-radius: 8px; background: #1f3a93; color: #fff; text-decoration: none; }
  `,
})
export class SubscriberDetail implements OnInit {
  readonly id = input.required<string>();

  private readonly subscribers = inject(SubscribersStore);
  private readonly ticketsStore = inject(TicketsStore);

  protected readonly subscriber = computed(() => this.subscribers.byId(this.id())());
  protected readonly plan = computed(() => {
    const s = this.subscriber();
    return planById(s ? s.planId : 'atlas-start');
  });
  protected readonly tickets = computed(() => this.ticketsStore.forSubscriber(this.id())());
  protected readonly formatMsisdn = formatMsisdn;

  ngOnInit(): void {
    void this.subscribers.load();
    void this.ticketsStore.load();
  }
}
