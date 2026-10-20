# Architecture

## Goals

- Business rules in one place, testable without HTTP.
- The server is the authority for permissions and validation. The browser may preview.
- Storage is swappable later, without rewriting the rules.
- Small enough to explain in a 60 to 90 minute code walkthrough.

## Layers

```
Route Handlers (src/app/api/**/route.ts)
  withApi: delay -> ?fail=1 -> user from cookie -> optional permission check
  parse input (Zod) -> call one service -> map errors to the standard error shape
        |
Services (src/server/services)
  inventory: createAdjustment, applyDirectAdjustment, applyTransfer, idempotency
  products:  listProducts, getProductDetail, getProductMovements, getStockHistory, stockScope
  imports:   readImportForm, validateImport, commitImport
  meta:      stores, categories, users, current user
        |
Repositories (src/server/repositories)
  Repository interface + InMemory implementation (globalThis store), TransactionManager,
  seed loader and seed rebasing, seeded from data/seed.json

Shared domain and helpers (src/domain, src/helpers), used by server AND client:
  domain:  errors, status, policy, stockRules, importValidation
  helpers: money, dates, csv, csvParse, importMapping, importDownload, productsCsv,
           productListUrl, productDetailUrl, storeUrl, adjustForm, errors, pagination, cn
  schemas: Zod schemas for every boundary
  types:   shared data shapes (server and client use the same ones)
  constants: fixed values as `as const`, query keys, error codes, copy for messages
```

Why the repository layer: the in-memory store is what the assignment asks for. The interface keeps services from knowing how data is stored, so a database implementation could replace it later. The interface is intentionally small: only what the rules need.

Trade-off to be honest about: an interface does not make a swap free. A real database implementation must give the same guarantees (a transaction for transfers, a unique constraint for idempotency keys, locking or constraints so stock cannot go negative under concurrency). The interface describes the contract. It does not provide the guarantee.

## Folder layout (as built)

```
src/
  app/                       routes only (App Router)
    layout.tsx               fonts, providers, session, meta prefetch, AppShell
    page.tsx                 redirects to /products
    error.tsx, not-found.tsx
    products/page.tsx        list (Server Component, prefetch) + loading.tsx
    products/[id]/page.tsx   detail (Server Component, prefetch) + loading.tsx, not-found.tsx
    import/page.tsx          server-side permission check, then the wizard
    api/                     route handlers (session, meta, products, imports, test/reset)
  api/                       browser HTTP client (axios instance, productsApi, importsApi, commonApi)
  apiHooks/                  TanStack Query hooks (useProducts, useImports, useMeta, useUser)
  components/
    ui/                      shadcn (kebab-case files)
    icons/                   Figma SVGs
    common/                  Banner, EmptyState, Pagination, PermissionGate, QueryErrorState, StatCard, StateBlock, StatusBadge
    layout/                  AppShell, MobileHeader, PageContainer, Sidebar/
    products/                list: view, toolbar, table, card list (mobile), chips, summary, selection toolbar, filters sheet
    detail/                  header, tabs content, chart, details card, stock by store, movements
    adjust/                  adjust stock dialog and its fields
    import/                  wizard, steps, mapping table, review table, done step
  config/env.ts              Zod-parsed environment (SIMULATED_LATENCY_MS, E2E, NODE_ENV)
  constants/                 as-const objects, queryKeys.ts
  schemas/                   Zod schemas
  types/                     shared types
  domain/                    pure business rules
  helpers/                   pure helpers
  hooks/                     client hooks (adjust form, idempotency key, import wizard, URL state, selection, export, now, debounced callback)
  providers/                 Providers (QueryClient, toasts on errors), SessionProvider
  server/
    http/                    withApi, parseRequest (parseJsonBody, parseQuery), readJsonBody
    repositories/            types, inMemory, transaction, seedLoader, rebaseSeed
    services/                inventory, products, imports, meta
    session.ts               getCurrentUser (cookie to user, default Staff)
    guards.ts                requirePermissionOrRedirect (used by the import page)
Outside src:
  tests/                     setup, helpers (mockCookies, mockRepository), server-only stub
  e2e/                       Playwright specs (Phase 6)
  data/seed.json             generated seed
  samples/import-sample.csv  sample import file (63 rows)
  public/stockroom-import-template.csv
  scripts/                   generate-seed.ts, generate-import-sample.ts, check-rules.mjs
  docs/
```

Known deviations from `docs/CONVENTIONS.md` (decide before the final review, or list them in the README):

- `session.ts` and `guards.ts` are single files in `src/server`, not folders.

## Shared domain rules (pure functions)

- `getStatus(onHand, reorderLevel)`: `out` if onHand is 0; `low` if onHand > 0 and onHand <= reorderLevel; otherwise `in_stock`. A reorder level of 0 can therefore never be Low.
- `isValidQuantity(quantity)`: whole number > 0. `canRemoveStock(onHand, quantity)`: false when the quantity is above the stock (equal is fine).
- `planDirectAdjustment(...)`: movement for receive, sell and write-off with `balanceAfter`.
- `planTransfer(...)`: returns the two movements. Invariant: the signed quantities add up to 0. Throws `INSUFFICIENT_STOCK` (409) or `VALIDATION_ERROR` with `SAME_STORE` (422).
- `roleHasPermission(role, permission)`: one policy table used by the server (authority) and the UI (lock or hide).
- `validateImportRow(values, context)` and `buildImportRowResult(...)`: one function with a list of error codes, used by the server. The browser does not validate rows; it only previews.

Types live in `src/types` (source of truth, not repeated here). Zod schemas live in `src/schemas`: `adjustmentSchema` (discriminated union), `productListQuerySchema`, movement query schema, `importFormSchema`, `importMappingSchema`.

## Request wrapper

Every route is wrapped with `withApi(request, handler, options?)`, which does:

1. Waits `SIMULATED_LATENCY_MS` (default 500).
2. If `?fail=1`, returns a 500 `INTERNAL_ERROR` before any state is touched.
3. Reads the user from the cookie `stockroom_user` and takes the role from the server's user list (missing or unknown means the default Staff user).
4. If `options.permission` is set, checks `roleHasPermission(role, permission)` and returns 403 `FORBIDDEN`. The import routes use this.
5. Runs the handler and maps thrown `AppError`s and `ZodError`s to the standard error shape (Zod issues become field codes such as `REQUIRED`, `NOT_A_WHOLE_NUMBER`, `MUST_BE_POSITIVE`, `TOO_SHORT`, `TOO_LONG`). Anything else is logged and returned as 500 `INTERNAL_ERROR`.

Having one wrapper means the error format, delay and fail switch cannot drift between routes.

## First render and TanStack Query

1. `layout.tsx` (Server Component) reads the user and prefetches `meta` into a `QueryClient`, then wraps the app in `<HydrationBoundary>` so the sidebar has stores and users immediately.
2. `products/page.tsx` parses the search params, creates a `QueryClient` and prefetches the list (and meta) by calling the same service function the API route uses. No HTTP hop to itself. It wraps `ProductsView` in `<HydrationBoundary state={dehydrate(queryClient)}>`.
3. `products/[id]/page.tsx` fetches the detail (a missing product calls `notFound()`), and prefetches the first movements page and the stock history.
4. `import/page.tsx` checks the permission first (`requirePermissionOrRedirect`), then prefetches meta.
5. Client components call `useQuery` with the same key, so they render instantly from the hydrated cache and refetch by normal rules.
6. If the URL has `?fail=1` or `?slow=1`, the page skips the prefetch. The client then fetches on its own and shows the real error or loading state. A failed prefetch is never dehydrated.
7. Query keys are built only in `src/constants/queryKeys.ts` from the normalized URL params, so server and client always agree.

QueryClient defaults (in `Providers`): `staleTime` 30 s; a 403 from any query shows a toast and calls `router.refresh()`; mutation errors show a toast with the server message unless the mutation sets `meta.silent`.

## URL state

The URL is the source of truth for list state and for the detail page.

- List: `store`, `q`, `category`, `status`, `sort`, `dir`, `page`, `pageSize` (parsed and written by `productListUrl.ts`; only non-default values are written).
- Detail: `store`, `tab` (`overview` | `movements`), movements `type`, `period` (parsed and written by `productDetailUrl.ts`).
- Import: `store`.
- `notice=managers-only` is a one-time message after a Staff redirect from `/import`.
- Hooks `useProductListUrlState` and `useProductDetailUrlState` read and write the URL; filters, store and page use `router.push` (Back works), the search box debounces and uses `router.replace`.

## Writes and cache updates

- `useMutationAdjustment` posts the adjustment with a key from `useIdempotencyKey`. On success it invalidates `queryKeys.products.all`, which covers the list, summary, detail, stock by store, movements and the chart, and shows a toast. The dialog closes and focus returns to the opener.
- Optimistic updates are not used. Stock rules live on the server, so the UI waits for the server answer.
- Import: `useMutationValidateImport` (Review step) and `useMutationCommitImport` (Done step). A successful commit invalidates the product queries.

## Idempotency

- Required `Idempotency-Key` header on adjustments and on import commit.
- The server stores `key -> { requestHash, status, body }` in the repository, written in the same transaction as the stock change. The hash is SHA-256 over canonical JSON (sorted keys) of the product id and body.
- Same key and same payload: return the stored result (status 201 for adjustments) with `Idempotent-Replay: true`. Nothing is applied twice.
- Same key and a different payload: 422 `IDEMPOTENCY_KEY_REUSED`.
- The check and the write run in one synchronous transaction with no `await` between them, so two parallel requests with the same key cannot both apply.
- Client (`useIdempotencyKey`): one key per payload. The key is kept for a retry after an ambiguous outcome (network error, timeout, 5xx) and replaced after success, after a definitive 4xx error, or when the payload changes. The submit button is disabled while the request is in flight.

## Transfer consistency

- A transfer has a shared `transferId` on both movements: `transfer_out` (negative) and `transfer_in` (positive).
- `createAdjustment` validates the cheap things first (key, permission, product, quantity, same store). Inside `repo.transaction(fn)`, `applyTransfer` checks that both stores carry the product and that the source has enough stock, then writes both stock rows, both movements and the idempotency record.
- In-memory implementation: `fn` runs synchronously (no `await`), so no other request can interleave in single-threaded JS. `TransactionManager` snapshots every touched product, stock row, the movement list length (and the per-product movement index) and the idempotency record the first time they are written. If anything throws, `rollback` restores them, so it is all or nothing.
- Tests: total stock across stores is unchanged by a transfer; a failure in the middle (destination does not carry the product) leaves both stores untouched.

## Permissions: why both places

- UI: a locked control with an explanation is better UX than a hidden one that fails later, and Staff should see what exists. The import link is hidden and the page redirects.
- Server: the UI can be bypassed (devtools, curl). The server is the only real enforcement.
  - Import routes: `withApi(..., { permission: PERMISSION.IMPORT })`.
  - Adjustments: `createAdjustment` checks `ADJUSTMENT_PERMISSION[input.type]`, because the needed permission depends on the body type.
  - Import page: `requirePermissionOrRedirect` runs before anything renders.
- Both use the same `roleHasPermission()` function so the rules cannot disagree.

## In-memory store details

- The store is kept on `globalThis` (`__stockroom_store__`) so Next.js dev hot reload and separate route bundles share one copy.
- At load time (skipped when `NODE_ENV === "test"`), movement timestamps are rebased by whole days so that the newest movement is today in `Asia/Kuala_Lumpur`. Chart ranges and "recent movements" stay fresh.
- `repo.reset()` reloads the seed. It is exposed by `POST /api/test/reset` in dev or when `E2E=1`.
- Data is lost on server restart (accepted by the brief).
- Limitation for the README: on Vercel each serverless instance has its own memory, so two requests can see different state, and instances are recycled. Fine for a demo, not for production. A real version needs a database.

## Seed data

- `scripts/generate-seed.ts` writes `data/seed.json` using a seeded PRNG, so the data is stable between runs.
- 248 products, 6 stores, 6 categories, 7 suppliers, 3 users, about 8,500 movements over roughly 90 days. A product is "carried" at a store when it has a stock row there, with its own on hand and reorder level. Products per store: Mont Kiara 212, Subang 191, Cheras 168, Damansara 162, Puchong 147, Shah Alam 147.
- Movements add up to the current stock (the seed integrity test checks it), so the chart and the numbers agree. Transfers come as linked pairs. Movements carry a note and the user who made them.
- Fixtures taken from the design and used in tests: see `docs/TESTING.md` section 4.
- The seed includes on purpose: out of stock, low stock, reorder level 0, a product with no movements, a product with one history point, products not carried at some stores, long names.

## Import architecture

```
Client (ImportWizard, useImportWizard reducer)
  state: step (upload | map | review | done), storeId, file, mapping, validationResult, commitResult, idempotencyKey
  1. Upload: PapaParse in the browser reads headers and a few rows for the mapping step and auto-match.
  2. Map: user maps columns to Stockroom fields; the five required fields must be mapped.
  3. Review: POST /api/imports/validate (file + mapping + store). On a result with valid rows, create idempotencyKey = crypto.randomUUID().
     "Import N rows" calls POST /api/imports/commit with the Idempotency-Key.
  4. Done: commit stats, link to products in that store, skipped rows CSV download.
```

Idempotency key lifecycle: created once when Review shows a valid result; kept across double clicks and retries; cleared when the file, store or mapping changes, or when the wizard is reset. The server replays the stored commit result for the same key and payload, and returns 422 `IDEMPOTENCY_KEY_REUSED` for the same key with a different payload. Details are in `docs/IMPORT.md`.

## Key function contracts

Paths are stable. Do not rename or move without telling the author. Adding exports is fine.

```
src/domain/errors.ts           class AppError(code, status, message, fieldErrors?)
src/domain/status.ts           getStatus(onHand, reorderLevel)
src/domain/policy.ts           roleHasPermission(role, permission)
src/domain/stockRules.ts       isValidQuantity, canRemoveStock, planDirectAdjustment, planTransfer
src/domain/importValidation.ts normalizeSku, findCategory, validateImportRow, buildImportRowResult
src/helpers/money.ts           parseMoneyToSen("68.00") -> 6800, formatMoney(6800, { withCurrency }) -> "RM 68.00"
src/helpers/dates.ts           formatWhen(date, now), formatDateTime(date), fixed time zone Asia/Kuala_Lumpur
src/helpers/csvParse.ts        parseCsv(text, { preview? }) -> { headers, rows, rowCount }
src/helpers/importMapping.ts   autoMatchColumns(headers)
src/server/services/inventory/createAdjustment.ts   createAdjustment(repo, productId, input, ctx)
src/server/services/imports/   readImportForm, validateImport, commitImport
```
