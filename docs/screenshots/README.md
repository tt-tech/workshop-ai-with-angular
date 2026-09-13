# Screenshots — to be captured by Adil

Run `npm start`, open http://localhost:4200 in a 1440×900 window, light mode, then save as PNG with these exact names (they are referenced from `../architecture.md` and the root README):

- `01-overview.png` — `/`
- `02-accounts.png` — `/accounts`
- `03-account-detail.png` — `/accounts/a-current`
- `04-requests.png` — `/requests`
- `05-legacy-transfer.png` — `/transfers/new/a-current` (wait for the form to load)
- `06-lint-arch-fail.png` — terminal: add `import { AccountsStore } from '@atlas/data-access-banking';` to `libs/ui/src/lib/page-header.ts`, run `npm run lint:arch`, capture the red error, revert.

Keep the browser chrome out of the shot. No personal data is on screen; everything is demo data.
