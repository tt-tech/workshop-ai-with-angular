# Task 000: pin the behaviour of libs/legacy/transfers before anything is migrated

## Goal

A photograph of what the legacy transfer form does today, as tests, so that every later migration step can be compared against it. Bugs included: the tests record current behaviour, they do not judge it.

## Scope

- Allowed to change: nothing that exists
- New files allowed in: `libs/legacy/transfers/src/lib/*.spec.ts`

## Out of scope

- Every non-spec file. If `validate()` looks wrong, write the test that proves what it does today and add `// TODO 000: looks wrong because …` above the test, not in the code
- `libs/domain`, `libs/data-access/*`, the new feature lib (that is task 002)

## Done when

- [ ] One `it()` per branch of `TransferComponent.validate()`, named for the behaviour it records
- [ ] One `it()` per public method of `TransferService`, through the real `AccountsStore` with an instant `FakeBackend`
- [ ] Every expectation asserts a hardcoded string or number, never a value recomputed by the code under test
- [ ] `npm run test` passes
- [ ] `git diff --stat main -- ':!*.spec.ts'` prints nothing (nothing outside spec files changed)
- [ ] Diff ≤ 300 lines

## Notes for the agent

- `TransferComponent` is `standalone: false` with constructor injection; for `validate()` it is enough to construct it directly with stand-ins for the four constructor parameters and set the fields
- The `limits` table in `validate()` ignores earlier transfers today; the domain rule `canTransfer()` does not. Record the legacy behaviour as it is and leave the TODO
- After task 002, run the same spec against the new component's `verdict()`/`error()` through the DOM and list every red as a decision in the PR
