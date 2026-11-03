# Task 007: Warn on a blocked account before the user tries to pay

## Goal

On the account page of a blocked account, the user sees why money cannot leave it and what to do, before they open the transfer form.

## Scope

- Allowed to change: `libs/feature/accounts`
- New tokens allowed in: `apps/atlas/src/styles/tokens/_theme.scss` (only if no existing `--color-*` role fits; light and dark value both)

## Out of scope

- `libs/domain` (the message exists: `blockerMessage['blocked-account']`), `libs/ui`, other features, any raw colour in a component

## Done when

- [ ] `npm run lint:arch` passes (it includes `check:tokens`)
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] `/accounts/a-joint` (the blocked Joint account) shows the blocker message in a banner with `role="status"`, readable in light and dark (switch with the theme button in the rail)
- [ ] "Make a transfer" is not offered on a blocked account; it still is on an active one
- [ ] One new spec opens `/accounts/a-joint` with `RouterTestingHarness` and reads the banner by its role
- [ ] Diff ≤ 150 lines

## Notes for the agent

- Closest analogue to mirror: the `.alert` in `libs/feature/transfers/src/lib/new-transfer.ts`; URL spec: `apps/atlas/src/app/transfer-screen.spec.ts`
- Domain constants to reuse: `blockerMessage` from `@atlas/domain`
- Styles: read `AGENTS.md` "Styles". Global `.alert` exists; a warning tone is `--color-warning` on `--color-warning-soft`
