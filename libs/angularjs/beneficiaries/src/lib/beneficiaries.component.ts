import { beneficiariesTemplate } from './beneficiaries.template';

// LEGACY (AngularJS 1.8) — frozen. One controller for the whole screen: loading, search, sort, the add form,
// counters and navigation, with watchers keeping copies of the same list in sync.
// Do not touch outside a task file that says "migrate".
export const beneficiariesScreen = {
  template: beneficiariesTemplate,
  controller: [
    '$scope',
    '$filter',
    'beneficiaryService',
    function (this: any, $scope: any, $filter: any, beneficiaryService: any) {
      this.loading = true;
      this.loadError = '';
      this.search = '';
      this.sortKey = 'name';
      this.sortLabel = 'Name';
      this.all = [];
      this.visible = [];
      this.pending = [];
      this.form = { name: '', rib: '' };
      this.formError = '';
      this.saving = false;
      this.countText = '';
      this.totalSentText = '';

      this.$onInit = () => {
        beneficiaryService
          .load()
          .then(() => {
            this.all = beneficiaryService.all();
            this.pending = beneficiaryService.pending();
            this.refresh();
            this.loading = false;
          })
          .catch((e: any) => {
            this.loading = false;
            this.loadError = e && e.message ? e.message : 'Could not load beneficiaries.';
          });
      };

      this.refresh = () => {
        const term = (this.search || '').toLowerCase().trim();
        let list = this.all;
        if (term) list = $filter('filter')(list, (b: any) => b.search.indexOf(term) > -1);
        list = $filter('orderBy')(list, this.sortKey === 'sent' ? 'sentMad' : 'name');
        this.visible = list;
        this.countText = beneficiaryService.countText(this.all.length + this.pending.length);
        this.totalSentText = beneficiaryService.totalSentText();
      };

      $scope.$watch(
        () => this.search,
        (now: any, before: any) => {
          if (now !== before) this.refresh();
        }
      );

      $scope.$watchCollection(
        () => this.pending,
        () => this.refresh()
      );

      this.toggleSort = () => {
        if (this.sortKey === 'name') {
          this.sortKey = 'sent';
          this.sortLabel = 'Most sent';
        } else {
          this.sortKey = 'name';
          this.sortLabel = 'Name';
        }
        this.refresh();
      };

      this.add = () => {
        this.formError = '';
        this.saving = true;
        beneficiaryService
          .add(this.form.name, this.form.rib)
          .then(() => {
            this.form = { name: '', rib: '' };
            beneficiaryService.focus('lb-name');
          })
          .catch((message: any) => {
            this.formError = message;
            beneficiaryService.focus(message.indexOf('RIB') > -1 ? 'lb-rib' : 'lb-name');
          })
          .finally(() => {
            this.saving = false;
          });
      };

      this.send = () => {
        beneficiaryService.sendMoney();
      };
    },
  ],
};
