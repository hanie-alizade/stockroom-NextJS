# Plan

The plan changed twice while building. This file records the plan that was actually followed (phases 0 to 9), what each phase delivered according to the git history, and what is left. Earlier plans (a 7-phase plan and a reduced 9-step plan) were dropped because the real order of work ended up different.

The brief's own rule still applies: a smaller app that is correct and well tested beats everything half done. Anything cut goes into the README under "What I cut", with the reason.

## Priorities from the brief

1. Products list with URL state and store switcher; product detail; adjust stock with all four types, the rules and the permissions on the server.
2. Import with mapping and server-side validation; Movements tab filters; the tests listed in the brief.
3. Bulk export of selected rows; clickable summary cards; the chart tooltip; mobile layouts beyond "usable".

Never cut: server permissions, server validation, idempotency, atomic transfer, the listed tests, the README answers, the Vercel deploy.

## Phases and status

Branch names follow the phase. Phases 0 through 6 and deployment are completed.

| Phase | Name                            | Branch                      | Status               |
| ----- | ------------------------------- | --------------------------- | -------------------- |
| 0     | Foundations                     | `phase-0-foundations`       | done                 |
| 1     | Domain rules and API            | `phase-1-domain-rules-api`  | done                 |
| 2     | UI shell                        | `Phase-2-ui-shell`          | done                 |
| 3     | Products list                   | `Phase-3-products`          | done                 |
| 4     | Product detail                  | `Phase-4-product-details`   | done                 |
| 5     | Adjust stock and Import         | `Phase-5-adjustment&import` | done                 |
| 6     | Playwright                      | `e2e`                       | done                 |
| 7     | Deploy to Vercel                | `main`                      | deployed, see README |
| 8     | Postman collection              | -                           | cut                  |
| 9     | Nice-to-have items of the brief | -                           | done                 |

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
- Import UI: wizard with Upload, Map columns, Review and Done steps.
- Done when: adjust dialog and import wizard are fully wired, tested, and integrated.

### Phase 6: Playwright (done)

Two specs in `e2e/`:

1. `e2e/manager-transfer.spec.ts`: Manager filters the list, opens a product, transfers stock and sees both stores' numbers change.
2. `e2e/staff-locked.spec.ts`: Write-off and Transfer are locked for Staff, and opening `/import` redirects with a notice message.

Delivered in this phase:

- Two Playwright test suites in `e2e/` with `e2e/helpers.ts` (`resetData`, `switchUser`).
- Route-level gap tests closed in `src/app/api/products/[id]/adjustments/__tests__/route.test.ts`.
- `POST /api/test/reset` test seam guarded by environment (`development` or `E2E=1`).
- `npm run e2e` script in `package.json` builds the app and executes Playwright tests.

### Phase 7: Deploy to Vercel (deployed, see README)

- Deployed to Vercel at https://stockroom-vert-one.vercel.app as documented in `README.md`.
- Environment variables documented in README.
- Documented in README: in-memory state limitation across serverless instances.

### Phase 8: Postman collection (cut)

Cut because no Postman collection was created; the Route Handlers and server decisions are thoroughly covered by Vitest route tests, curl examples in docs, and the Playwright suite.

### Phase 9: Nice-to-have items of the brief (done)

Most priority-3 items were built alongside the screens they belong to:

- **Bulk export of selected rows**: built (`ProductsSelectionToolbar` with "Export selected", full-list and selection CSV export in `useProductsExport`).
- **Clickable summary cards**: built (cards use `aria-pressed`, clicking toggles `low_stock` or `out_of_stock` filter chips).
- **Chart tooltip**: built (`StockChartTooltip` displaying date, stock on hand, and price across 7d, 30d, 90d intervals).
- **Mobile layouts beyond "usable"**: built (`MobileHeader` with drawer sheet, product cards at <768px, bottom filter sheet with draft state, responsive table containers, responsive detail page).

Gaps acknowledged in README under "What I cut":

- Detail page `···` button: button next to "Adjust stock" has no actions defined in Figma, so it is omitted (the table row actions menu IS built and opens Adjust stock).
- React Testing Library component tests: 3 component test files exist (`AdjustStockDialog.test.tsx`, `ProductsFiltersSheet.test.tsx`, `ProductsTable.test.tsx`, 21 tests total). Other areas rely on unit, hook, service, route, and end-to-end coverage.

## Cut order if time runs short (phases 6 to 9)

1. Phase 9 polish items (row actions menu, component tests).
2. Nice-to-have E2E (focus trap, URL restore).
3. Postman collection (cut).
4. Never cut: the two required Playwright tests, the route-level Staff 403 tests, the deploy, the README answers.

## Risks

- In-memory data on Vercel: each serverless instance has its own memory. A transfer can look "lost" on the next request. Fine for the demo, must be said in the README.
- Playwright tests share the in-memory store: call `POST /api/test/reset` before each test (`E2E=1` is set by the Playwright config).
- Query keys differ between server and client: they are built only in `src/constants/queryKeys.ts`.
- Code the author cannot explain: read every diff before committing, and keep the AI usage section honest.

## Plan history

1. First plan: 7 phases, with Phase 7 as a "polish pool" to drop first (about 20 hours).
2. Reduced plan: 9 numbered steps (about 14 hours), cutting the import UI, selection, export and clickable cards.
3. Actual path (this file): the cut items were built anyway while building each screen, so the remaining work became Playwright, deploy, Postman and a final pass over the brief's nice-to-have list.
