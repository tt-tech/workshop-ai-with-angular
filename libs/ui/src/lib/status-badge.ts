import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SubscriberStatus, TicketStatus } from '@atlas/domain';

type BadgeStatus = SubscriberStatus | TicketStatus;

const tone: Record<BadgeStatus, 'ok' | 'warn' | 'muted'> = {
  active: 'ok',
  open: 'ok',
  pending: 'warn',
  suspended: 'warn',
  closed: 'muted',
  terminated: 'muted',
};

@Component({
  selector: 'atlas-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge--' + tone()">{{ status() }}</span>`,
  styles: `
    .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }
    .badge--ok { background: #e3f6ea; color: #1b6b3a; }
    .badge--warn { background: #fff2d9; color: #8a5a00; }
    .badge--muted { background: #eceff3; color: #5a6270; }
  `,
})
export class StatusBadge {
  readonly status = input.required<BadgeStatus>();
  protected readonly tone = computed(() => tone[this.status()]);
}
