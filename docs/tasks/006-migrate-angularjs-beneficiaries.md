# Task 006: Rebuild the AngularJS beneficiaries screen as a modern feature beside it

## Goal
A customer sees, searches and adds beneficiaries on `/beneficiaries` exactly as today, served by a standalone, signals-based feature lib instead of the AngularJS module in `libs/angularjs/beneficiaries`. The AngularJS lib stays in the tree, untouched, until a later task deletes it.

## Scope
- Allowed to change: `apps/atlas` (the `beneficiaries` entry in `apps/atlas/src/app/app.routes.ts` only), `tsconfig.base.json` (one new `@atlas/feature-beneficiaries` path)
- New files allowed in: `libs/feature/beneficiaries` (new lib, tags `scope:atlas` + `type:feature`, same scaffolding as `libs/feature/requests`)

## Out of scope
- `libs/angularjs/**`: this is not a `migrate` task. Build beside it, do not edit, do not delete
- `libs/ui`: `Amount` stays exactly as it is. The AngularJS template still renders it by tag string until the AngularJS lib is deleted (see step 0)
- `libs/data-access/*`: `AccountsStore` already has `beneficiaries`, `accounts` and `transactions`. The "waiting for activation" list is view-local, as it is today
- `libs/domain`: `formatRib` and `formatMad` already exist; the AngularJS service re-implements one and drifts from the other

## Done when
- [ ] Step 0 is written into the PR before any code: every `downgradeComponent` and `downgradeInjectable` registration, and every AngularJS template that uses each registered name (see notes)
- [ ] `npm run lint:arch` passes
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] `git diff --stat main -- libs/angularjs ':!*.spec.ts'` prints nothing
- [ ] On `/beneficiaries`: same table (Name, Bank, RIB, Sent), same search, same sort toggle, "Send money" opens `/transfers/new/a-current`, the add form shows the same messages word for word ("A RIB has 24 digits.", "This beneficiary already exists.", …) and a valid entry lands under "Waiting for activation"
- [ ] The pinned specs in `libs/angularjs/beneficiaries/src/lib/beneficiaries-host.spec.ts` are run against the new component through the DOM; every red is a decision in the PR (the header total is the known one: it uses `$filter('number')`, `formatMad` does not)
- [ ] Diff ≤ 300 lines, not counting the generator's scaffolding

## Notes for the agent
- Step 0, the hidden readers. The TypeScript compiler cannot see AngularJS templates. List them:
  - `grep -rn "downgradeComponent\|downgradeInjectable" libs apps` gives the registrations and their AngularJS names (`atlasAmount`, `accountsStore`, `ngRouter`)
  - for each component name, grep its kebab-case tag (`atlas-amount`) in every AngularJS template string; for each injectable name, grep the string (`'accountsStore'`) in every AngularJS factory, service and controller annotation
  - a rename or an input change on anything in that list breaks `/beneficiaries` at runtime only: `typecheck`, `lint:arch` and the production build stay green
- Split the oversized code before you port it. `beneficiary.service.ts` mixes four jobs: reading the store, rules (`validate`, `sentTo`, `bankFor`), formatting (`formatRib`, `totalSentText`, `countText`) and DOM (`focus`, `flashRow`). The rules become pure functions in the new lib with their own spec; formatting comes from `@atlas/domain`; DOM goes into the template (`autofocus`, a CSS class bound to a signal); the store is read directly. `beneficiaries.component.ts` holds one controller for five concerns; the new component holds view-local signals and `computed`s, nothing else
- Closest analogue to mirror: `libs/feature/accounts/src/lib/account-list.ts` (`inject(AccountsStore)`, `load()` in `ngOnInit`, `@for` with `track`)
- State: beneficiaries, accounts and transactions are global server-backed (`AccountsStore`). Search, sort, the form fields, the form error and the activation list are view-local signals. Nothing is navigation-keyed. Do not add a store
- Order: build the feature, flip the one route line, delete the AngularJS lib last in its own task. Deleting it also removes the last reason for `@angular/upgrade`, `angular` and the `type:legacy-ajs` tag
