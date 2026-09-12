# Task <id>: <one-line title>

## Goal
<one or two sentences: what the user gets>

## Scope
- Allowed to change: `libs/feature/<x>`, `libs/data-access/<y>` (list the projects)
- New files allowed in: <list or "none">

## Out of scope
- <shared components, other features, anything in libs/legacy unless this says "migrate">

## Done when
- [ ] `npm run lint:arch` passes
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] <one user-visible outcome, phrased as something a tester can click>
- [ ] Diff ≤ 300 lines  (raise explicitly if the task needs more, and say why)

## Notes for the agent
- Closest analogue to mirror: <file>
- Domain constants to reuse: <from libs/domain>
