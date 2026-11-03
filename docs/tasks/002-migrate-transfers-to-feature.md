# Task 002: Rebuild the transfer form as a modern feature beside the legacy one

## Goal

A customer makes a transfer from `/transfers/new/:accountId` exactly as today, served by a standalone, signals-based feature lib instead of `LegacyTransfersModule`. The legacy lib stays in the tree, untouched, until task 003 deletes it.

## Scope

- Allowed to change: `apps/atlas` (the `transfers` entry in `apps/atlas/src/app/app.routes.ts` only), `tsconfig.base.json` (one new `@atlas/feature-transfers` path)
- New files allowed in: `libs/feature/transfers` (new lib, tags `scope:atlas` + `type:feature`, same scaffolding as `libs/feature/requests`)

## Out of scope

- `libs/legacy/**` — this is not a `migrate` task. Build beside it, do not edit, do not delete
- `libs/ui` (no new shared component — a plain form in the feature is fine)
- `libs/domain` (the rules already exist; if `canTransfer()` looks wrong, say so in the PR and stop)
- `libs/data-access/*` (`AccountsStore` already has `beneficiaries`, `byId()`, `transferredTodayMad()` and `transfer()`)

## Done when

- [ ] `npm run lint:arch` passes
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] `git diff --stat main -- libs/legacy ':!*.spec.ts'` prints nothing
- [ ] On `/transfers/new/a-current`: same fields as today (From with label and balance, Beneficiary select with the first beneficiary preselected, Amount, Label max 35 chars, Confirm button that reads "Sending…" while saving), same validation messages word for word, and on success the app navigates to `/accounts/a-current` with the balance lowered
- [ ] Every business rule comes from `canTransfer()` in `@atlas/domain`; the messages come from `blockerMessage`. No limits table, no status check, no balance comparison in the component
- [ ] The `Make a transfer` link on `/accounts/a-current` still lands on the new form (route path unchanged: `transfers/new/:accountId`)
- [ ] Diff ≤ 300 lines, not counting the generator's scaffolding (`project.json`, `tsconfig*.json`, `vite.config.mts`, `eslint.config.mjs`, `test-setup.ts`, `README.md`)

## Notes for the agent

- Closest analogue to mirror: `libs/feature/accounts/src/lib/account-detail.ts` (`input.required<string>()` bound by `withComponentInputBinding`, `inject(AccountsStore)`, `computed` for the account, `load()` in `ngOnInit`). Routes file: `libs/feature/accounts/src/lib/accounts.routes.ts`. Index: `libs/feature/accounts/src/index.ts` exports the routes only
- Route: `transfersRoutes = [{ path: 'new/:accountId', component: NewTransfer }]`, mounted in `app.routes.ts` with `loadChildren` like the other features. The component input must be named `accountId` to match the param
- Domain to reuse from `@atlas/domain`: `canTransfer`, `blockerMessage`, `TransferBlocker`, `packageById`, `formatMad`; from `@atlas/ui`: `PageHeader`, `MadPipe`
- State: the account and beneficiaries are global server-backed state — read them from `AccountsStore`. Beneficiary, amount, label, error and saving are view-local — plain `signal`s in the component. There is no navigation-keyed state here. Do not add a store
- Daily limit: `canTransfer()` takes `transferredTodayMad` — pass `AccountsStore.transferredTodayMad(accountId)`. The legacy table ignored earlier transfers today; the domain rule is the intended behaviour. Mention it in the PR
- The legacy "No account." message is unreachable (the form only renders once the account exists). Do not carry it over
- The legacy component fetched from `FakeBackend` directly; the new one goes through the store, so call `load()` — a user can land on this URL first
