import { Component, inject, OnInit } from '@angular/core';
import { RequestsStore } from '@atlas/data-access-banking';
import { PageHeader, StatusBadge } from '@atlas/ui';

@Component({
  selector: 'atlas-request-list',
  imports: [PageHeader, StatusBadge],
  template: `
    <atlas-page-header title="Requests" [subtitle]="store.openCount() + ' in progress'" />
    @if (store.loading()) {
      <p class="muted">Loading requests…</p>
    } @else {
      <table class="table">
        <thead><tr><th>Request</th><th>Category</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>
          @for (r of store.requests(); track r.id) {
            <tr>
              <td class="strong">{{ r.subject }}</td>
              <td class="cap">{{ r.category }}</td>
              <td><atlas-status-badge [status]="r.status" /></td>
              <td class="muted">{{ r.createdAt }}</td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="muted">Nothing in progress. Start a request from an account page.</td></tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .strong { font-weight: 500; }
    .cap { text-transform: capitalize; }
    .muted { color: var(--ink-2); }
  `,
})
export class RequestList implements OnInit {
  protected readonly store = inject(RequestsStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
