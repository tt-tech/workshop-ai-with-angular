# Task 001: Export an account's transactions to CSV

## Goal
A customer can download the currently filtered transactions of an account as a CSV file from the account page.

## Scope
- Allowed to change: `libs/feature/accounts`
- New files allowed in: `libs/feature/accounts/src/lib/` (a pure `transactions-csv.ts` + its spec)

## Out of scope
- `libs/ui` (no new shared component — a plain button in the feature is fine)
- `libs/data-access/*` (the transactions are already in the store)
- `libs/legacy/**`

## Done when
- [ ] `npm run lint:arch` passes
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] On `/accounts/a-current`, filtering by category then clicking "Export CSV" downloads a file whose rows match the filtered table
- [ ] The CSV formatting is a pure function with its own spec (`toCsv(transactions)`)
- [ ] Diff ≤ 300 lines

## Notes for the agent
- Closest analogue to mirror: `libs/feature/accounts/src/lib/account-detail.ts`
- Domain helpers to reuse: `formatMad`, `categoryLabel` from `@atlas/domain`
