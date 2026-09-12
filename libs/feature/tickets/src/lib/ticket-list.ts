import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketsStore } from '@atlas/data-access-subscribers';
import { PageHeader, StatusBadge } from '@atlas/ui';

@Component({
  selector: 'atlas-ticket-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeader, StatusBadge],
  template: `
    <atlas-page-header title="Tickets" [subtitle]="store.openCount() + ' open'" />
    @if (store.loading()) {
      <p class="muted">Loading tickets…</p>
    } @else {
      <table class="table">
        <thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Created</th><th>Subscriber</th></tr></thead>
        <tbody>
          @for (t of store.tickets(); track t.id) {
            <tr>
              <td>{{ t.subject }}</td>
              <td>{{ t.category }}</td>
              <td><atlas-status-badge [status]="t.status" /></td>
              <td>{{ t.createdAt }}</td>
              <td><a [routerLink]="['/subscribers', t.subscriberId]">{{ t.subscriberId }}</a></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e6e9ef; }
    th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #5a6270; }
    .muted { color: #5a6270; }
  `,
})
export class TicketList implements OnInit {
  protected readonly store = inject(TicketsStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
