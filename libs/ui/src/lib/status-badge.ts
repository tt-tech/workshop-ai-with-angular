import { Component, computed, input } from '@angular/core';
import type { AccountStatus, CardStatus, RequestStatus } from '@atlas/domain';

type BadgeStatus = AccountStatus | CardStatus | RequestStatus;

const tone: Record<BadgeStatus, 'ok' | 'attention' | 'muted'> = {
  active: 'ok',
  open: 'attention',
  pending: 'attention',
  blocked: 'attention',
  expired: 'muted',
  closed: 'muted',
};

@Component({
  selector: 'atlas-status-badge',
  template: `<span class="badge" [class]="'badge badge--' + tone()"
    ><i class="dot"></i>{{ status() }}</span
  >`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0.125rem var(--space-2);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      text-transform: capitalize;
      white-space: nowrap;
    }
    .dot {
      width: 0.4375rem;
      height: 0.4375rem;
      border-radius: 50%;
    }
    .badge--ok {
      background: var(--color-brand-soft);
      color: var(--color-brand-text);
    }
    .badge--ok .dot {
      background: var(--color-success-dot);
    }
    .badge--attention {
      background: var(--color-warning-soft);
      color: var(--color-warning);
    }
    .badge--attention .dot {
      background: var(--color-warning-dot);
    }
    .badge--muted {
      background: var(--color-surface-sunken);
      color: var(--color-text-muted);
    }
    .badge--muted .dot {
      background: var(--color-neutral-dot);
    }
  `,
})
export class StatusBadge {
  readonly status = input.required<BadgeStatus>();
  protected readonly tone = computed(() => tone[this.status()]);
}
