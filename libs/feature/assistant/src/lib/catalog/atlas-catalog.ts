import { BasicCatalogBase } from '@a2ui/angular';
import { assistantCatalogId } from '@atlas/domain';
import { accountCardImplementation } from './account-card';
import { blockedNoticeImplementation } from './blocked-notice';
import { spendingChartImplementation } from './spending-chart';
import { transactionListImplementation } from './transaction-list';

const catalogLocale = 'en-GB';

export class AtlasCatalog extends BasicCatalogBase {
  constructor() {
    super({
      id: assistantCatalogId,
      locale: catalogLocale,
      extraComponents: [accountCardImplementation, blockedNoticeImplementation, spendingChartImplementation, transactionListImplementation],
    });
  }
}
