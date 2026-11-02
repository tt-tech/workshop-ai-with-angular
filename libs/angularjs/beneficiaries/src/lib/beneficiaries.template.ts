// LEGACY (AngularJS 1.8) — frozen. <atlas-amount> below is the downgraded Angular component from @atlas/ui.
export const beneficiariesTemplate = `
<section class="lb">
  <header class="lb-header">
    <h1 class="lb-title">Beneficiaries</h1>
    <p class="lb-muted" ng-if="!$ctrl.loading">{{ $ctrl.countText }} · {{ $ctrl.totalSentText }} sent</p>
  </header>

  <p class="lb-muted" ng-if="$ctrl.loading">Loading beneficiaries…</p>
  <p class="lb-error" ng-if="$ctrl.loadError">{{ $ctrl.loadError }}</p>

  <div ng-if="!$ctrl.loading && !$ctrl.loadError">
    <div class="lb-toolbar">
      <input type="text" id="lb-search" placeholder="Search by name or bank" aria-label="Search beneficiaries" ng-model="$ctrl.search" />
      <button type="button" class="button button--ghost" ng-click="$ctrl.toggleSort()">Sort: {{ $ctrl.sortLabel }}</button>
    </div>

    <table class="table">
      <thead>
        <tr><th>Name</th><th>Bank</th><th>RIB</th><th class="num">Sent</th><th></th></tr>
      </thead>
      <tbody>
        <tr ng-repeat="b in $ctrl.visible track by b.id" id="row-{{ b.id }}">
          <td class="lb-strong">{{ b.name }}</td>
          <td>{{ b.bank }}</td>
          <td class="lb-mono">{{ b.ribText }}</td>
          <td class="num"><atlas-amount [value]="b.sentMad"></atlas-amount></td>
          <td class="num"><button type="button" class="button button--ghost" ng-click="$ctrl.send(b)">Send money</button></td>
        </tr>
        <tr ng-if="$ctrl.visible.length === 0">
          <td colspan="5" class="lb-muted">No beneficiary matches "{{ $ctrl.search }}".</td>
        </tr>
      </tbody>
    </table>

    <h2 class="lb-subtitle" ng-if="$ctrl.pending.length > 0">Waiting for activation</h2>
    <ul class="lb-pending" ng-if="$ctrl.pending.length > 0">
      <li ng-repeat="p in $ctrl.pending track by p.id" id="row-{{ p.id }}">
        <span class="lb-strong">{{ p.name }}</span> · {{ p.bank }} · <span class="lb-mono">{{ p.ribText }}</span>
        <span class="lb-muted">active on {{ p.activatesText }}</span>
      </li>
    </ul>

    <form class="lb-form" name="addForm" novalidate ng-submit="$ctrl.add()">
      <h2 class="lb-subtitle">Add a beneficiary</h2>
      <label for="lb-name">Name</label>
      <input type="text" id="lb-name" maxlength="40" ng-model="$ctrl.form.name" ng-change="$ctrl.formError = ''" />
      <label for="lb-rib">RIB</label>
      <input type="text" id="lb-rib" maxlength="30" placeholder="24 digits" ng-model="$ctrl.form.rib" ng-change="$ctrl.formError = ''" />
      <p class="lb-error" role="alert" ng-if="$ctrl.formError">{{ $ctrl.formError }}</p>
      <button type="submit" class="button" ng-disabled="$ctrl.saving">Add beneficiary</button>
    </form>
  </div>
</section>
`;
