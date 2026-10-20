# Stockroom

Stock app for Kopi Lane, a café chain with six stores. Take-home project for Radii (Frontend Engineer, Round 2).
It is a Next.js App Router app with a real backend inside it: Route Handlers, in-memory data seeded from JSON, permissions and validation on the server.

- **Live:** https://stockroom-vert-one.vercel.app
- **Docs:** [docs/](docs/) (see index at the bottom)

## Try it in two minutes

There is no real login. The current user is a cookie, and the **first visit is Faiz Hakim (Staff)** on purpose: the server falls back to the least privileged user. Use **Switch** in the sidebar and choose **Aina Rahman (Manager)** to see everything.

1. **List.** Change the store in the sidebar (every number updates), search, filter, sort, change page size. Copy the URL into a new tab: you get the same view. Click the **Low stock** card to filter by it. Select a few rows and use **Export selected**.
2. **Detail.** Open **Arabica beans 1 kg** (`KL-1042`): 30-day chart (7d, 30d, 90d), details card, stock by store, and the **Movements** tab with filters.
3. **Adjust stock** (as Manager). Choose **Transfer**, Mont Kiara to Subang, 5 units. The dialog closes, a toast appears and numbers change in detail, movements, list and cards with no reload. Try 999 units to see `INSUFFICIENT_STOCK`.
4. **As Staff.** **Write-off** and **Transfer** are visible but locked (lock icon, tooltip). `/import` redirects to Products with a message.
5. **Import** (as Manager). Upload [`samples/import-sample.csv`](samples/import-sample.csv) (63 rows) into Mont Kiara. Columns auto-map by name, review flags 8 invalid rows for download, and valid rows import atomically.
6. **States.** The first render is prefetched on the server, so it has no skeleton by design. Add `?slow=1` to a page URL to see the loading states (the client fetches through the API with the 500 ms delay), or change the store, search, filters, sort or page to see them while navigating. Add `?fail=1` to see the error states.

## Quick start

```bash
nvm use && npm install && npm run dev   # Node 22 (.nvmrc), http://localhost:3000
npm test                                # Vitest: 376 tests in 38 files
npm run check                           # Typecheck, ESLint, repo rules, Vitest
npm run e2e                             # Playwright (npx playwright install chromium once)
```

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm test` | Vitest: domain, helpers, hooks, services, routes, components |
| `npm test -- <path>` | Run a single test file |
| `npm run check` | Typecheck, ESLint, repo rules, and Vitest |
| `npm run e2e` | Playwright: builds and runs `e2e/*.spec.ts` |
| `npm run build` | Production build |
| `npm run sample:import` | Regenerates `samples/import-sample.csv` from the seed |

Optional env vars (`.env.example`): `SIMULATED_LATENCY_MS` (default `500`, Playwright sets `0`), `E2E=1` (enables `POST /api/test/reset` in production builds). Stop `npm run dev` before `npm run e2e` so Playwright uses its dedicated production settings.

| Brief requirement | Where |
| ----------------- | ----- |
| Unit tests: status | `src/domain/__tests__/status.test.ts` (reorder level 0 never Low, boundaries, sums) |
| Unit tests: cannot go below zero, transfer totals | `src/domain/__tests__/stockRules.test.ts` (exact stock allowed, transfer sums to 0) |
| Route tests: Staff 403 on write-off, transfer; oversell code | `src/app/api/products/[id]/adjustments/__tests__/route.test.ts` (`FORBIDDEN`, `INSUFFICIENT_STOCK`) |
| Route tests: Staff 403 on import | `src/app/api/imports/__tests__/route.test.ts` (validate and commit) |
| CSV row validation, >= 5 problem kinds | `src/domain/__tests__/importValidation.test.ts` (7 error codes), plus `importsService.test.ts` |
| Playwright: Manager transfer updates both stores | `e2e/manager-transfer.spec.ts` |
| Playwright: Staff locks on Write-off and Transfer | `e2e/staff-locked.spec.ts` |

## Tech stack

Next.js 16 (App Router), React 19, TypeScript (strict, no `any`), Tailwind 4, shadcn/ui, TanStack Query, Zod, Recharts, Vitest + React Testing Library, Playwright. Deployed on Vercel.

- `papaparse` for CSV parsing in browser and server; `axios` for client error normalization; `sonner` for mutation toasts; Radix primitives for accessible dialogs, selects, and menus.
- Figma variables map to semantic tokens in `src/app/globals.css` (`bg-bg-canvas`, `text-text-primary`, `text-page-title`, etc.). Hex values are prohibited outside `globals.css` (enforced by `scripts/check-rules.mjs`).

## How it works

### How the first page of data gets from the server into TanStack Query

The list and detail pages are Server Components. They read search params, instantiate a `QueryClient`, and call `prefetchQuery` with the same query key and service function the API route uses—avoiding self-HTTP calls. The page renders inside `<HydrationBoundary state={dehydrate(queryClient)}>`. Client components call `useQuery` with the same key, rendering instantly from cache without initial flash. Query keys are centralized in `src/constants/queryKeys.ts`. If prefetch fails (`?fail=1`), the query is not dehydrated, letting the client fetch and display the real error state with retry (`?slow=1` skips prefetch the same way to show loading states).

### Where permissions are checked, and why in both places

- **Server (authority):** Import routes check `roleHasPermission(role, PERMISSION.IMPORT)` via `withApi` (403 for Staff); `/import` page redirects Staff server-side. Adjustments check `ADJUSTMENT_PERMISSION[type]` in `createAdjustment` (403 for Staff write-off/transfer). Roles are derived from the user cookie on the server.
- **Client (UI lock):** Uses the same `roleHasPermission()` to show locked options with tooltips rather than hiding them. Both sides share one policy table (`src/domain/policy.ts`).

### How a double adjustment is stopped

- **Client:** `useIdempotencyKey` generates one UUID per payload. The submit button disables during transit. Retries reuse the key; successful requests, 4xx errors, or edits issue a new one.
- **Server:** `Idempotency-Key` header is required. Keys and SHA-256 payload hashes are recorded inside a synchronous repository transaction. Replays return the stored 201 response with `Idempotent-Replay: true`; mismatched payloads return 422 `IDEMPOTENCY_KEY_REUSED`.

### How the transfer's two movements stay consistent

`planTransfer` validates that the two stores differ and source stock is sufficient, producing linked `transfer_out` and `transfer_in` movements summing to zero. In `applyTransfer`, `repo.transaction()` snapshots state and executes synchronously. If any check fails, `TransactionManager` rolls back all changes atomically.

### API errors and calling without the UI

API responses share a unified `{ error, message, fieldErrors }` format ([docs/API.md](docs/API.md)). Cookie `stockroom_user` sets the caller (`aina-rahman` for Manager, `faiz-hakim` for Staff):

```bash
BASE=https://stockroom-vert-one.vercel.app

# Staff write-off: 403 FORBIDDEN
curl -i -X POST $BASE/api/products/KL-1042/adjustments \
  -H "Content-Type: application/json" -H "Idempotency-Key: $(uuidgen)" -H "Cookie: stockroom_user=faiz-hakim" \
  -d '{"type":"write_off","storeId":"mont-kiara","quantity":1,"note":"Expired"}'

# Manager oversell: 409 INSUFFICIENT_STOCK
curl -i -X POST $BASE/api/products/KL-1042/adjustments \
  -H "Content-Type: application/json" -H "Idempotency-Key: $(uuidgen)" -H "Cookie: stockroom_user=aina-rahman" \
  -d '{"type":"sell","storeId":"mont-kiara","quantity":999}'

# Idempotent replay: second call returns Idempotent-Replay: true without applying twice
KEY=$(uuidgen)
for i in 1 2; do curl -i -X POST $BASE/api/products/KL-1042/adjustments \
  -H "Content-Type: application/json" -H "Idempotency-Key: $KEY" -H "Cookie: stockroom_user=aina-rahman" \
  -d '{"type":"receive","storeId":"mont-kiara","quantity":1}'; done
```

### Import and Seed data

- **Import:** Four-step wizard (Upload, Map columns, Review, Done). The browser parses headers for auto-matching; the server independently re-parses and validates every row on validate and commit with atomic rollback and idempotent replays. Full rules in [docs/IMPORT.md](docs/IMPORT.md).
- **Seed data:** Generated deterministically via `scripts/generate-seed.ts` into `data/seed.json` (248 products across 6 stores, ~8,500 movements matching on-hand stock, integer sen prices). Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deploy and production limits

Deployed on Vercel from `main`. Key considerations for the live demo:

- **In-memory data:** Serverless instances have isolated in-memory stores and recycle across requests. Acceptable for a demo, but requires a persistent database in production.
- **Reset route:** `POST /api/test/reset` answers 404 in production builds (requires `development` or `E2E=1`).
- **Upload size:** Vercel limits request bodies to ~4.5 MB, returning a platform HTTP 413 before Route Handlers run; the browser client normalizes this to `FILE_TOO_LARGE`.
- **Session cookie:** `stockroom_user` is `httpOnly`, `sameSite=lax`, and `Secure` in production, storing user ID only.

## Decisions for the parts that were not designed

- **Below 1024px:** Sidebar collapses into a top drawer (`MobileHeader`). Tables scroll horizontally with sticky SKU/Name columns from 768px; below 768px products become cards, and filters move to a bottom sheet with draft state. Adjust dialog stacks inputs below 640px.
- **Import Done step:** Displays 4 summary stat cards (Created, Updated, Unchanged, Skipped), downloadable skipped CSV, and quick navigation.
- **Scope and unstocked products:** Store filter scopes cards, totals, and tables. Viewing an unstocked store displays a "Not carried at store" notice instead of false zeros.
- Other decisions (summary cards ignore filters, All stores status sums, SKU as ID, status urgency sorting) are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Answers to the "Open questions" in the Handoff notes

- **Is reorder level 0 ever Low?** No. Low requires stock > 0 and <= reorder level; reorder 0 means "never reorder". Stock 0 is Out; positive stock is In stock.
- **Transfer to the same store:** Disallowed in UI (destination omitted) and rejected with 422 `VALIDATION_ERROR` (`SAME_STORE`).
- **Sorting by Status:** Urgency order: Out first, then Low, then In stock on descending (the first click), ties broken by SKU.
- **Chart with one point:** Rendered as a visible dot with caption "Only 1 data point so far", avoiding misleading trendlines.

## Accessibility

Dialog traps focus, closes on Esc, and returns focus to its trigger (focus lands on selected type first). Tabs, segmented controls, selects, and menus support keyboard navigation. Locked options use `aria-disabled` so tooltips remain discoverable via keyboard. Tables include `aria-sort` and `aria-busy`, live regions announce updates, and all interactive elements maintain accessible names and touch targets.

## AI usage

- **Devin (desktop agent):** Wrote initial code in focused prompts following `AGENTS.md`. Backend used TDD (tests first); frontend tests written after.
- **Claude (chat):** Screen measurement from Figma screenshots, prompt drafting, repo reviews, and doc alignment.
- **Changes made:** Replaced early plans with direct feature builds; moved files out of `src/lib` to clean top-level barrels; corrected `Idempotent-Replay` header naming; overhauled stock history calculation to walk backward from current stock. Every diff was manually reviewed.

## What I cut and what I would do next

- **What I cut:** Detail page `···` button (no Figma actions defined; table row menu is built and opens Adjust stock); keyboard focus on chart tooltip (hover works); Chromium-only Playwright test run; auth replaced with cookie user switcher.
- **What I would do next:** Add keyboard navigation to the chart tooltip, test across Firefox/WebKit, and add component tests for import wizard steps (3 component test files exist today: `AdjustStockDialog.test.tsx`, `ProductsFiltersSheet.test.tsx`, `ProductsTable.test.tsx`, 21 tests total).

## Three things I would change in a second version

1. **Database-backed repository:** Replace in-memory transactions with PostgreSQL row-level locks, unique constraints for idempotency, and expiring user-scoped keys.
2. **Signed sessions and unified middleware:** Replace plaintext cookies with JWT/iron-session, and check permissions before payload validation across all routes.
3. **Automated CI pipeline:** Run `check`, Playwright e2e, and automated axe accessibility audits on every pull request.

## Docs

| File | What is in it |
| ---- | ------------- |
| [AGENTS.md](AGENTS.md) | Rules for coding agents: scope, hard rules, git, final message |
| [docs/PLAN.md](docs/PLAN.md) | Phases that were followed, status, what is left |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, folder layout, data flow, transactions, contracts |
| [docs/API.md](docs/API.md) | Routes, error codes, headers, idempotency |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | Naming, structure, TypeScript, React, tests, commits |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Answers to open questions, undesigned parts, known gaps |
| [docs/UI-NOTES.md](docs/UI-NOTES.md) | UI behaviour from Figma annotations, as built |
| [docs/SCREENS.md](docs/SCREENS.md) | Exact copy, names and formats |
| [docs/IMPORT.md](docs/IMPORT.md) | Import rules, wizard and commit |
| [docs/TESTING.md](docs/TESTING.md) | Test layers, seams, fixtures, coverage against the brief |
