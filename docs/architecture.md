# Architecture

Atlas Bank is small on purpose: enough shape to feel like an enterprise Angular codebase, small enough to read in an hour. Every diagram below is generated from what the linter enforces, not from intention.

## 1. Libraries and the dependency contract

Arrows mean "may import". Anything not drawn is a lint error (`npm run lint:arch`).

```mermaid
flowchart TB
  subgraph app["apps/atlas · scope:atlas · type:app"]
    atlas["atlas<br/>shell + routes"]
  end

  subgraph feature["type:feature"]
    dash["feature-dashboard"]
    accounts["feature-accounts"]
    requests["feature-requests"]
  end

  subgraph legacy["type:legacy · frozen"]
    transfers["legacy-transfers<br/>NgModule · *ngIf · markForCheck"]
  end

  subgraph ui["type:ui"]
    uilib["ui<br/>StatusBadge · PageHeader · Amount · MadPipe"]
  end

  subgraph da["type:data-access"]
    banking["data-access-banking<br/>AccountsStore · CardsStore · RequestsStore<br/>FakeBackend = the boundary"]
  end

  subgraph dom["scope:domain · type:domain"]
    domain["domain<br/>models · canTransfer() · formatRib() · formatMad()"]
  end

  atlas --> dash
  atlas --> accounts
  atlas --> requests
  atlas --> transfers
  dash --> uilib
  dash --> banking
  accounts --> uilib
  accounts --> banking
  requests --> uilib
  requests --> banking
  transfers --> banking
  uilib --> domain
  banking --> domain
  dash --> domain
  accounts --> domain
  requests --> domain
  transfers --> domain

  classDef frozen fill:#f5f5f5,stroke:#999,stroke-dasharray: 4 3,color:#333
  classDef boundary fill:#e4eef0,stroke:#0e4d5b,color:#093843
  class transfers frozen
  class banking boundary
```

Rules encoded in `eslint.config.mjs` (`depConstraints`) and mirrored in `sheriff.config.ts`:

| Tag                | May depend on                    |
| ------------------ | -------------------------------- |
| `type:domain`      | nothing                          |
| `type:data-access` | data-access, domain              |
| `type:ui`          | ui, domain                       |
| `type:feature`     | feature, ui, data-access, domain |
| `type:legacy`      | legacy, data-access, domain      |
| `type:app`         | everything                       |
| `scope:domain`     | scope:domain only                |
| `scope:atlas`      | scope:atlas, scope:domain        |

Two things the diagram makes visible that a folder tree does not: `ui` never reaches `data-access` (presentational components take inputs), and `legacy` may read the modern stores but nothing modern imports legacy — the arrow only points one way, which is what makes it deletable later.

## 2. Runtime: how a page gets its data

```mermaid
sequenceDiagram
  participant R as Router
  participant C as AccountDetail (feature)
  participant S as AccountsStore (signals)
  participant B as FakeBackend (boundary)

  R->>C: navigate /accounts/:id (withComponentInputBinding → id())
  C->>S: load()
  alt already loaded
    S-->>C: resolved immediately
  else first call
    S->>B: getAccounts() · getTransactions() · getBeneficiaries()
    Note over B: simulated 250 ms latency
    B-->>S: arrays
    S->>S: set signals · loaded = true
  end
  Note over C: computed(): account, transactions, filtered, pkg
  C-->>R: template re-renders from signals (zoneless)
```

The store's `load()` is idempotent while in flight — concurrent callers share one promise. Tests rely on this: `await TestBed.inject(AccountsStore).load()` resolves exactly when the component's own load resolves.

## 3. The legacy corner (module 2 target)

```mermaid
flowchart LR
  route["/transfers/new/:accountId"] --> M["LegacyTransfersModule<br/>NgModule · RouterModule.forChild"]
  M --> TC["TransferComponent<br/>standalone:false · *ngIf/*ngFor<br/>constructor DI · Subscription[]<br/>any · rules duplicated inline"]
  TC --> TS["TransferService<br/>Observable wrapper"]
  TS --> ST["AccountsStore (modern)"]
  TS --> FB["FakeBackend"]
  TC -. markForCheck() after every callback .-> CD["zoneless change detection"]

  classDef old fill:#f5f5f5,stroke:#999,stroke-dasharray: 4 3,color:#333
  class M,TC,TS old
```

What is wrong with it, on purpose: business rules that already exist as `canTransfer()` in `libs/domain` are re-implemented inline with a magic limits table; state is plain fields kept alive by `markForCheck()`; the component both fetches and validates. The migration exercise removes all three without changing behaviour.

## 4. Agent guidance: one source of truth, any tool

```mermaid
flowchart TB
  AG["AGENTS.md<br/>layout · boundaries · non-negotiables · tests · done-checklist · task files"]
  CL["CLAUDE.md<br/>@AGENTS.md + Nx block"] --> AG
  CU[".cursor/rules/atlas.mdc"] --> AG
  CO[".github/copilot-instructions.md"] --> AG
  GE["GEMINI.md"] --> AG
  SK[".agents/skills · official Angular + Nx skills"] -.-> AG
  TASK["docs/tasks/&lt;id&gt;-&lt;slug&gt;.md<br/>scope · out of scope · done-when · ≤300 lines"] --> AG
  AG --> CHECK["npm run lint:arch · test · typecheck<br/>the checks don't care which agent wrote the code"]

  classDef src fill:#e4eef0,stroke:#0e4d5b,color:#093843
  class AG src
```

## 5. Tracks in git

```mermaid
gitGraph
  commit id: "Atlas Bank, three frameworks" tag: "main"
  branch "track1/m1-start"
  commit id: "no AGENTS.md, no boundaries"
  checkout main
  branch "track1/m1-solution"
  commit id: "task 001: CSV export"
  checkout main
  branch "track1/m2b-angularjs-solution"
  commit id: "task 006: beneficiaries migrated"
  checkout main
  branch "track1/m2-ngmodule-solution"
  commit id: "pin, build beside, flip"
  commit id: "delete legacy last"
  branch "track1/m2c-tokens-solution"
  commit id: "task 007: blocked banner"
  checkout "track1/m2-ngmodule-solution"
  branch "track1/m5-start"
  commit id: "security rules removed"
  branch "track1/m5-security-solution"
  commit id: "receipt + rules + fix"
```

`main` is the start of every track: nothing migrated, all rules on. A `*-start` branch exists only where a module starts from less than `main` (module 1 without guidance, module 5 without the security rules). `track1/solution` merges every Track 1 solution. When `main` changes, the track branches are rebased onto it, so a reference never drifts from the code people start with.

## Screenshots

Taken from the running app (`npm start`, 1440×900, light). Files live in `docs/screenshots/`.

| File                     | Route                      | Shows                                                         |
| ------------------------ | -------------------------- | ------------------------------------------------------------- |
| `01-overview.png`        | `/`                        | balance figure, three numbers, recent activity, accounts rail |
| `02-accounts.png`        | `/accounts`                | list with formatted RIBs, package, status, balance            |
| `03-account-detail.png`  | `/accounts/a-current`      | transactions with category filter, details, cards             |
| `04-requests.png`        | `/requests`                | request list                                                  |
| `05-legacy-transfer.png` | `/transfers/new/a-current` | the frozen legacy form, deliberately dated                    |
| `06-lint-arch-fail.png`  | terminal                   | `npm run lint:arch` failing on a `ui → data-access` import    |

![Overview](screenshots/01-overview.png)
![Account detail](screenshots/03-account-detail.png)
![Legacy transfer](screenshots/05-legacy-transfer.png)
