# Task 008: Keep the demoted legacy transfer screen building and reachable

## Goal

The demoted NgModule transfer screen is the rollback. It builds again and is reachable at `/transfers/legacy/new/:accountId`, so the framework map shows all three frameworks on `main`.

## Scope

- Allowed to change: `libs/legacy/transfers/src/lib/transfer.service.ts` (repair only: adapt to the current store contract), `apps/atlas/src/app/app.routes.ts`
- New files allowed in: none

## Out of scope

- Any other change in `libs/legacy`, migrating it, restyling it (its 2017 look is the point)

## Done when

- [ ] `npm run lint:arch`, `npm run test` (no changed assertions), `npm run typecheck` pass
- [ ] `/transfers/legacy/new/a-current` renders the legacy form; with the framework map on it has the violet "Angular NgModule (legacy)" outline
- [ ] The modern screen `/transfers/new/a-current` is unchanged
- [ ] Diff ≤ 30 lines

## Notes for the agent

- The break: task 005 made `AccountsStore.transfer()` return the created `Transaction`; the legacy service still declares `Observable<void>` (TS2322). Nothing caught it because nothing imported the lib. A demoted lib still has to build, or the rollback is gone.
