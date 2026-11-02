import angular from 'angular';
import { Router } from '@angular/router';
import { downgradeComponent, downgradeInjectable, setAngularJSGlobal } from '@angular/upgrade/static';
import { AccountsStore } from '@atlas/data-access-banking';
import { Amount } from '@atlas/ui';
import { beneficiariesScreen } from './beneficiaries.component';
import { beneficiaryService } from './beneficiary.service';

setAngularJSGlobal(angular);

export const beneficiariesModule = angular
  .module('atlas.beneficiaries', [])
  .directive('atlasAmount', downgradeComponent({ component: Amount }) as angular.IDirectiveFactory)
  .factory('accountsStore', downgradeInjectable(AccountsStore))
  .factory('ngRouter', downgradeInjectable(Router))
  .factory('beneficiaryService', beneficiaryService)
  .component('beneficiariesScreen', beneficiariesScreen);

export const beneficiariesScreenTag = 'beneficiaries-screen';
