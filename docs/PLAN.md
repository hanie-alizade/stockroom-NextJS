# Plan

The plan changed twice while building. This file records the plan that was actually followed (phases 0 to 9), what each phase delivered according to the git history, and what is left. Earlier plans (a 7-phase plan and a reduced 9-step plan) were dropped because the real order of work ended up different.

The brief's own rule still applies: a smaller app that is correct and well tested beats everything half done. Anything cut goes into the README under "What I cut", with the reason.

## Priorities from the brief

1. Products list with URL state and store switcher; product detail; adjust stock with all four types, the rules and the permissions on the server.
2. Import with mapping and server-side validation; Movements tab filters; the tests listed in the brief.
3. Bulk export of selected rows; clickable summary cards; the chart tooltip; mobile layouts beyond "usable".

Never cut: server permissions, server validation, idempotency, atomic transfer, the listed tests, the README answers, the Vercel deploy.

## Phases and status

Branch names follow the phase. Phases 0 to 4 are on `main` (`dc56958`). Phase 5 lives on `Phase-5-adjustment` and `Phase-5-adjustment&import` and is not on `main` or on `origin` yet.

| Phase | Name                            | Branch                      | Status      |
| ----- | ------------------------------- | --------------------------- | ----------- |
| 0     | Foundations                     | `phase-0-foundations`       | done        |
| 1     | Domain rules and API            | `phase-1-domain-rules-api`  | done        |
| 2     | UI shell                        | `Phase-2-ui-shell`          | done        |
| 3     | Products list                   | `Phase-3-products`          | done        |
| 4     | Product detail                  | `Phase-4-product-details`   | done        |
| 5     | Adjust stock and Import         | `Phase-5-adjustment&import` | done        |
| 6     | Playwright                      | to be created               | in progress |
| 7     | Deploy to Vercel                | to be created               | planned     |
| 8     | Postman collection              | to be created               | planned     |
| 9     | Nice-to-have items of the brief | to be created               | planned     |

### Phase 0: Foundations (15 to 16 Oct)

- Project docs and agent config, tooling: ESLint rules (including explicit return types), Prettier, husky hooks, `lint-staged`, `scripts/check-rules.mjs`.
- Vitest and Playwright configuration.
- Design tokens mapped to the Tailwind theme, IBM Plex fonts, text-style utilities.
- Deterministic seed generator (`scripts/generate-seed.ts`, seeded PRNG).
- Done when: `npm run dev` and `npm run check` work.

### Phase 1: Domain rules and API (16 to 17 Oct)

- Method: TDD. Failing tests first (status, money, policy, dates, stock rules), then the code.
- Domain: `getStatus`, money helpers, policy table, stock rules, Zod schemas, fixed time zone date formatting.
- Server: repository interface and in-memory implementation, `withApi` wrapper, session, meta and reset routes, products, product detail, movements and stock-history routes, `createAdjustment` service.
- Done when: every rule of the brief's "Adjust stock" and "backend rules" sections has a passing test.

### Phase 2: UI shell (17 Oct)

- Reusable components and Figma icons, sidebar and layout, shared types, store selector and user switcher, session provider and meta service.
- Done when: the shell renders, the user can switch role and store.

### Phase 3: Products list (17 to 18 Oct)

- List page and components: table, filters, search (uncontrolled, debounced), sort, pagination, summary cards, selection, CSV export (full list and selected rows), chips, loading, empty and error states, "synced" timestamp.
- Structure refactors: constants, types and schemas consolidated, folders moved to top level, PascalCase components, co-located `__tests__`.
- Server hardening: `?fail=1` on every route, `readJsonBody`, reset route guarded by environment, integer money parsing, seed consistency test.
- Done when: a shared link opens the same view, the store switcher changes every number, all states can be seen with `?fail=1` and the delay.

### Phase 4: Product detail (18 to 19 Oct)

- Overview (details card, stock by store, 30-day chart) and Movements tab with API integration.
- Domain: `planTransfer`, `planDirectAdjustment`, idempotency and movement DTO split out of the service.
- Server: route helpers and Zod-to-error-code mapping, enforced pagination, time zone helpers, stock-history validation, seed rebasing so the newest movement is "today", 248 unique product names, API docs.
- Merged to `main`.

### Phase 5: Adjust stock and Import (from 19 Oct)

- Refactor pass: unified role permissions (`policy`, `PermissionGate`, server guard), centralized client error info, query error states and route fallbacks, responsive shell, mobile card list with filter sheet, responsive detail page.
- Adjust dialog: form, "After this change" preview, Staff locks, wired to the API with idempotency keys and toasts. List, cards, detail and movements update without reload.
- Import backend: parser, row validation, `validate` and `commit` routes, sample CSV (63 rows), template file.
- Import UI: wizard with Upload, Map columns and Review. The Done step component and commit wiring are present in the code.
- Check before merging: the last commit message on the branch says "steps 1 to 3". Make sure the Done step and the commit wiring are committed too (`git status` must be clean).

### Phase 6: Playwright (in progress)

Required by the brief:

1. A Manager filters the list, opens a product, transfers stock and sees both stores' numbers change.
2. Write-off and Transfer are locked for Staff.

Also planned in this phase, in this order:

- Route handler gaps listed in `docs/TESTING.md` (Staff 403 for transfer at route level, oversell at route level, idempotency at route level).
- E2E helpers: reset endpoint call and a user switch through the cookie.
- Vitest speed: set `SIMULATED_LATENCY_MS=0` once in `vitest.config.ts` (most route tests currently wait 500 ms per request).
- Staff opening `/import` is redirected (extra assertion in the Staff test).
- Nice-to-have E2E if time allows: dialog focus trap, Esc, focus returns to the opener; URL state restored on reload.
- README "Tests" section with the exact commands.
- Done when: `npm test` and `npm run e2e` each run with one command and pass.

### Phase 7: Deploy to Vercel (planned)

- Merge the phase branches to `main` and push (Vercel builds from `main`).
- Set environment variables (see `docs/DEPLOYMENT.md`), run `npm run check:full` first.
- Smoke test on the live URL as Manager and as Staff: list, detail, transfer, import with the sample file, `?fail=1`.
- Put the URL in the README. Known limit to state there: each serverless instance has its own memory.

### Phase 8: Postman collection (planned)

Goal: let a reviewer try the API without the UI, and show that the server decides.

- One collection file in the repo (for example `docs/postman/stockroom.postman_collection.json`) and one environment file with `baseUrl`.
- Requests for: session switch (Manager and Staff), meta, products list, product detail, movements, stock history, adjustments (receive, sell, write-off, transfer), import validate, import commit, test reset (local only).
- Pre-request script that generates a UUID for the `Idempotency-Key` header.
- Tests per request: status code, error code (`FORBIDDEN`, `INSUFFICIENT_STOCK`, `IDEMPOTENCY_KEY_REUSED`), and the unified error shape.
- Folders "Manager" and "Staff" to show the 403 cases on purpose, plus a "Replay" request that sends the same key twice.
- A short section in `docs/API.md` or the README on how to import and run it.

### Phase 9: Nice-to-have items of the brief (planned)

Most of the priority-3 items were built earlier together with the screens they belong to. This phase re-checks them against the brief and closes what is left.

| Item in the brief                        | State in code                                                          | Left to do                                     |
| ---------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Bulk export of selected rows             | built (selection toolbar, "Export selected")                           | check against 375px and Back behavior          |
| Clickable Low stock / Out of stock cards | built (`aria-pressed`, click toggles the status filter)                | add a test                                     |
| Chart tooltip                            | built (`StockChartTooltip`, 7d / 30d / 90d)                            | keyboard focus check                           |
| Mobile layouts beyond "usable"           | built (MobileHeader sheet, card list, filter sheet, responsive detail) | walk through at 375px; fix what breaks         |
| Row actions menu (`···`)                 | button renders but has no menu or handler                              | wire it to "Adjust stock" or remove it         |
| React Testing Library component tests    | none yet (hook and helper tests only)                                  | at least the adjust dialog validation messages |

## Cut order if time runs short (phases 6 to 9)

1. Phase 9 polish items.
2. Nice-to-have E2E (focus trap, URL restore).
3. Postman collection down to the core requests (adjustments, import, 403 cases).
4. Never cut: the two required Playwright tests, the route-level Staff 403 tests, the deploy, the README answers.

## Risks

- Phase 5 is not on `main` or `origin`. Merge and push before the deploy, or Vercel will build old code.
- In-memory data on Vercel: each serverless instance has its own memory. A transfer can look "lost" on the next request. Fine for the demo, must be said in the README.
- Playwright tests share the in-memory store: call `POST /api/test/reset` before each test (`E2E=1` is set by the Playwright config).
- Query keys differ between server and client: they are built only in `src/constants/queryKeys.ts`.
- Code the author cannot explain: read every diff before committing, and keep the AI usage section honest.
- Branch name `Phase-5-adjustment&import` contains `&`, which needs quoting in shells and CI. Rename it before pushing if it causes trouble.

## Plan history

1. First plan: 7 phases, with Phase 7 as a "polish pool" to drop first (about 20 hours).
2. Reduced plan: 9 numbered steps (about 14 hours), cutting the import UI, selection, export and clickable cards.
3. Actual path (this file): the cut items were built anyway while building each screen, so the remaining work became Playwright, deploy, Postman and a final pass over the brief's nice-to-have list.
