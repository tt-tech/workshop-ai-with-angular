import { Component, computed } from '@angular/core';
import { CatalogComponent, createComponentImplementation } from '@a2ui/angular';
import { type ComponentApi, DynamicValueSchema } from '@a2ui/web_core/v1_0';
import { assistantComponents } from '@atlas/domain';
import { Amount } from '@atlas/ui';
import { z } from 'zod';
import { transactionRowsOf } from './bound-value';

const transactionListApi = {
  name: assistantComponents.transactionList,
  schema: z.object({ rows: DynamicValueSchema }).strict(),
} satisfies ComponentApi;

@Component({
  selector: 'atlas-transaction-list',
  imports: [Amount],
  template: `
    <table class="table">
      <tbody>
        @for (row of rows(); track row.id) {
          <tr>
            <td class="muted small nowrap">{{ row.date }}</td>
            <td>{{ row.label }}</td>
            <td class="num"><atlas-amount [value]="row.amountMad" /></td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class TransactionList extends CatalogComponent<typeof transactionListApi> {
  protected readonly rows = computed(() => transactionRowsOf(this.props().rows?.value()));
}

export const transactionListImplementation = createComponentImplementation(transactionListApi, TransactionList);
