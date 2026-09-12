# Task 001: Export the subscriber list to CSV

## Goal
A atlas agent can download the currently filtered subscriber list as a CSV file from the subscribers page.

## Scope
- Allowed to change: `libs/feature/subscribers`
- New files allowed in: `libs/feature/subscribers/src/lib/` (a pure `subscribers-csv.ts` + its spec)

## Out of scope
- `libs/ui` (no new shared component — a plain button in the feature is fine)
- `libs/data-access/*` (the list is already in the store)
- `libs/legacy/**`

## Done when
- [ ] `npm run lint:arch` passes
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] On `/subscribers`, filtering by city then clicking "Export CSV" downloads a file whose rows match the filtered table
- [ ] The CSV formatting is a pure function with its own spec (`toCsv(subscribers)`)
- [ ] Diff ≤ 300 lines

## Notes for the agent
- Closest analogue to mirror: `libs/feature/subscribers/src/lib/subscriber-list.ts`
- Domain constants to reuse: `formatMsisdn` from `@atlas/domain`
