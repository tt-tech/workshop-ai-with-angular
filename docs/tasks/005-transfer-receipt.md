# Task 005: transfer receipt with EUR equivalent and a formatted label (PRODUCT-412)

## Goal

After a transfer, the customer lands on a receipt: amount in MAD with the EUR equivalent, the label with `**bold**` rendered, a reference, and a "Copy receipt" button.

## Scope

- Allowed to change: `libs/feature/transfers`, `libs/data-access/banking` (rate endpoint on the boundary, `transactionById`, `transfer()` returning the created transaction), `apps/atlas` routes if needed
- New files allowed in: `libs/feature/transfers/src/lib`, `libs/data-access/banking/src/lib`

## Out of scope

- `libs/domain` rules. PRODUCT-412 also asks that Premium customers "may exceed the daily limit": that is a change to `packages[].dailyTransferLimitMad` in the domain and to the backend check, decided by product and compliance, not a component override. Do not implement it here; note it in the PR
- Any call from the browser to a third party. The EUR rate comes from the backend (`FakeBackend.getEurRate()` here)
- `libs/legacy/**`

## Done when

- [ ] `npm run lint:arch` passes (boundaries, house rules, secrets scan)
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes
- [ ] On `/transfers/new/a-current`, a 500 MAD transfer with label `Loyer **octobre**` lands on `/transfers/receipt/<id>` showing `500,00 MAD`, `≈ 46.00 EUR`, the word octobre in bold, and the reference
- [ ] A label of `<img src=x onerror=alert(1)>` renders as that literal text (test)
- [ ] The backend rejects a transfer the rules forbid, whatever the client sent (test)
- [ ] No secret, key or absolute third-party URL in `apps/` or `libs/` (secrets scan, lint)
- [ ] Diff ≤ 300 lines

## Notes for the agent

- Closest analogue: `libs/feature/accounts/src/lib/account-detail.ts` for the page shape; `AccountsStore` for the store pattern; `RatesStore` is the model for a tiny store over one backend call
- Render formatting by mapping a whitelisted subset to elements in the template (`label-format.ts`), never by building HTML from the label
- Reuse `formatMad` through `MadPipe`; do not format money in the component
