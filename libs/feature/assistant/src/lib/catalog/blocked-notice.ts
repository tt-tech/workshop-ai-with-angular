import { Component, computed } from '@angular/core';
import { CatalogComponent, createComponentImplementation } from '@a2ui/angular';
import { type ComponentApi, DynamicStringSchema } from '@a2ui/web_core/v1_0';
import { assistantComponents } from '@atlas/domain';
import { z } from 'zod';
import { stringOf } from './bound-value';

const blockedNoticeApi = {
  name: assistantComponents.blockedNotice,
  schema: z.object({ text: DynamicStringSchema }).strict(),
} satisfies ComponentApi;

@Component({
  selector: 'atlas-blocked-notice',
  template: `
    <p class="blocked" role="status">
      <span class="label small">Blocked by the server</span>
      <span>{{ text() }}</span>
    </p>
  `,
  styles: `
    .blocked {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-danger);
      border-radius: var(--radius-m);
      background: var(--color-danger-soft);
    }
    .label {
      color: var(--color-danger);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  `,
})
export class BlockedNotice extends CatalogComponent<typeof blockedNoticeApi> {
  protected readonly text = computed(() => stringOf(this.props().text?.value()) ?? '');
}

export const blockedNoticeImplementation = createComponentImplementation(blockedNoticeApi, BlockedNotice);
