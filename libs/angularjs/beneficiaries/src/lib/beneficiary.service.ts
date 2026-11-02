import angular from 'angular';
import type { Router } from '@angular/router';
import type { AccountsStore } from '@atlas/data-access-banking';

// LEGACY (AngularJS 1.8) — frozen. One service for everything the beneficiaries screen needs:
// fetching, caching, business rules, formatting, focus and highlight, navigation.
// Do not touch outside a task file that says "migrate".
export const beneficiaryService = [
  '$q',
  '$filter',
  '$timeout',
  '$window',
  'accountsStore',
  'ngRouter',
  ($q: any, $filter: any, $timeout: any, $window: any, accountsStore: AccountsStore, ngRouter: Router) => {
    const cache: any = { loaded: false, accounts: [], beneficiaries: [], transactions: [], pending: [] };
    const service: any = {};

    // ---- fetching -------------------------------------------------------------------------------

    service.load = () => {
      if (cache.loaded) return $q.when(cache);
      return $q.when(accountsStore.load()).then(() => {
        cache.accounts = angular.copy(accountsStore.accounts());
        cache.transactions = angular.copy(accountsStore.transactions());
        cache.beneficiaries = angular.copy(accountsStore.beneficiaries()).map((b: any) => service.decorate(b));
        cache.loaded = true;
        return cache;
      });
    };

    service.all = () => cache.beneficiaries;
    service.pending = () => cache.pending;

    service.decorate = (b: any) => {
      b.ribText = service.formatRib(b.rib);
      b.sentMad = service.sentTo(b);
      b.search = (b.name + ' ' + b.bank).toLowerCase();
      return b;
    };

    // ---- business rules -------------------------------------------------------------------------

    service.sentTo = (b: any) => {
      let total = 0;
      for (let i = 0; i < cache.transactions.length; i++) {
        const t = cache.transactions[i];
        if (t.category !== 'transfer' || t.amountMad >= 0) continue;
        const label = (t.label || '').toLowerCase();
        if (label.indexOf(b.name.toLowerCase()) > -1 || label.indexOf(b.rib.substr(-4)) > -1) {
          total = total + t.amountMad;
        }
      }
      return total;
    };

    service.bankFor = (rib: string) => (rib.substr(0, 3) === '007' ? 'Atlas Bank' : 'Other bank');

    service.validate = (name: string, rib: string) => {
      const cleanName = (name || '').trim();
      const cleanRib = (rib || '').replace(/\s/g, '');
      if (cleanName.length < 2) return 'Enter the beneficiary name.';
      if (!/^\d{24}$/.test(cleanRib)) return 'A RIB has 24 digits.';
      for (let i = 0; i < cache.accounts.length; i++) {
        if (cache.accounts[i].rib === cleanRib) return 'This RIB is one of your own accounts.';
      }
      const known = cache.beneficiaries.concat(cache.pending);
      for (let i = 0; i < known.length; i++) {
        if (known[i].rib === cleanRib) return 'This beneficiary already exists.';
      }
      if (cache.pending.length >= 3) return 'Three beneficiaries are already waiting for activation.';
      return '';
    };

    service.add = (name: string, rib: string) => {
      const error = service.validate(name, rib);
      if (error) return $q.reject(error);
      const cleanRib = rib.replace(/\s/g, '');
      const activatesOn = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const created = service.decorate({ id: 'p-' + (cache.pending.length + 1), name: name.trim(), rib: cleanRib, bank: service.bankFor(cleanRib) });
      created.activatesText = $filter('date')(activatesOn, 'dd/MM/yyyy');
      cache.pending.push(created);
      service.flashRow(created.id);
      return $q.when(created);
    };

    service.defaultAccount = () => {
      for (let i = 0; i < cache.accounts.length; i++) {
        if (cache.accounts[i].type === 'current' && cache.accounts[i].status === 'active') return cache.accounts[i];
      }
      return cache.accounts[0];
    };

    // ---- formatting -----------------------------------------------------------------------------

    service.formatRib = (rib: string) => rib.substr(0, 3) + ' ' + rib.substr(3, 3) + ' ' + rib.substr(6, 16) + ' ' + rib.substr(22);

    service.totalSentText = () => {
      let total = 0;
      cache.beneficiaries.forEach((b: any) => (total = total + Math.abs(b.sentMad)));
      return $filter('number')(total, 2) + ' MAD';
    };

    service.countText = (n: number) => (n === 1 ? '1 beneficiary' : n + ' beneficiaries');

    // ---- DOM ------------------------------------------------------------------------------------

    service.focus = (id: string) => {
      $timeout(() => {
        const el = $window.document.getElementById(id);
        if (el) el.focus();
      });
    };

    service.flashRow = (id: string) => {
      $timeout(() => {
        const row = angular.element($window.document.getElementById('row-' + id));
        row.addClass('is-new');
        $window.setTimeout(() => row.removeClass('is-new'), 2000);
      });
    };

    // ---- navigation -----------------------------------------------------------------------------

    service.sendMoney = () => ngRouter.navigateByUrl('/transfers/new/' + service.defaultAccount().id);

    return service;
  },
];
