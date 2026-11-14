import { Component, computed } from '@angular/core';
import { CatalogComponent, createComponentImplementation } from '@a2ui/angular';
import { type ComponentApi, DynamicNumberSchema, DynamicStringSchema } from '@a2ui/web_core/v1_0';
import { assistantComponents } from '@atlas/domain';
import { Amount } from '@atlas/ui';
import { z } from 'zod';
import { numberOf, stringOf } from './bound-value';

const accountCardApi = {
  name: assistantComponents.accountCard,
  schema: z.object({ name: DynamicStringSchema, maskedNumber: DynamicStringSchema, balance: DynamicNumberSchema }).strict(),
} satisfies ComponentApi;

const missingValue = '—';

@Component({
  selector: 'atlas-account-card',
  imports: [Amount],
  template: `
    <article class="account" [attr.aria-label]="name()">
      <span class="muted small mono">{{ maskedNumber() ?? missing }}</span>
      <span class="strong">{{ name() ?? missing }}</span>
      @let amount = balance();
      @if (amount === undefined) {
        <span class="balance">{{ missing }}</span>
      } @else {
        <atlas-amount class="balance" [value]="amount" />
      }
    </article>
  `,
  styles: `
    .account {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-m);
      background: var(--color-surface-raised);
    }
    .balance {
      font-size: var(--text-xl);
    }
  `,
})
export class AccountCard extends CatalogComponent<typeof accountCardApi> {
  protected readonly missing = missingValue;
  protected readonly name = computed(() => stringOf(this.props().name?.value()));
  protected readonly maskedNumber = computed(() => stringOf(this.props().maskedNumber?.value()));
  protected readonly balance = computed(() => numberOf(this.props().balance?.value()));
}

export const accountCardImplementation = createComponentImplementation(accountCardApi, AccountCard);
