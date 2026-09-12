import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge--' + tone()"><i class="dot"></i>{{ status() }}</span>`,
  styles: `
    .badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; font-weight: 500; text-transform: capitalize; color: var(--ink-2); }
    .dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: currentColor; }
    .badge--ok .dot { background: var(--green); }
    .badge--attention .dot { background: var(--amber); }
    .badge--muted .dot { background: var(--line-strong); }
  `,
})
export class StatusBadge {
  readonly status = input.required<BadgeStatus>();
  protected readonly tone = computed(() => tone[this.status()]);
}
