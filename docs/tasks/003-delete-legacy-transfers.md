# Task 003: migrate — delete the legacy transfers lib

## Goal

`libs/legacy/transfers` is gone. `/transfers/new/:accountId` keeps working from `libs/feature/transfers` (task 002).

## Scope

- Allowed to change: delete `libs/legacy/transfers` (whole directory), `tsconfig.base.json` (remove the `@atlas/legacy-transfers` path), `eslint.config.mjs` (remove the two `libs/legacy/**` override blocks), `sheriff.config.ts` (remove the `libs/legacy/<name>/src` tagging line)
- New files allowed in: none

## Out of scope

- `apps/atlas/src/app/app.routes.ts` — already points at `@atlas/feature-transfers` after task 002; if it does not, stop and do task 002 first
- `libs/feature/transfers`, `libs/domain`, `libs/data-access/*` — nothing to change there
- The `type:legacy` tag rules in `depConstraints` and `sheriff.config.ts` stay: the next legacy lib will need them

## Done when

- [ ] `grep -rn "legacy-transfers\|libs/legacy" apps libs tsconfig.base.json eslint.config.mjs sheriff.config.ts` prints nothing
- [ ] `npm run lint:arch` passes (`type:legacy` was only ever importable by `type:app`, so nothing modern can depend on the lib)
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes: the proof that the app no longer imports the lib either
- [ ] `/transfers/new/a-current` still shows the transfer form and a transfer still lands on `/accounts/a-current`
- [ ] Diff ≤ 300 lines (deletions do not count)

## Notes for the agent

- This task says `migrate`: editing (here, deleting) `libs/legacy/**` is allowed for this task only
- Nothing to mirror. Nothing to write
