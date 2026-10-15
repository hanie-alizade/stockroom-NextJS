# Architecture

## Goals

- Business rules in one place, testable without HTTP.
- The server is the authority for permissions and validation. The browser may preview.
- Storage is swappable later, without rewriting the rules.
- Small enough to explain in a 60 to 90 minute code walkthrough.

## Layers

```
Route Handlers (src/app/api/**/route.ts)
  parse input (Zod) -> authorize -> call service -> map errors to the standard error shape
        |
Services (src/lib/server/services)
  inventory.service: adjustments, transfer, idempotency
  products.service:  list, detail, summary, stock history
  imports.service:   validate rows, commit rows
        |
Repository interface (src/lib/server/repo/types.ts)
        |
InMemory implementation (src/lib/server/repo/in-memory.ts), seeded from data/seed.json

Pure domain (src/lib/domain), used by server AND client:
  status.ts, stock-rules.ts, money.ts, policy.ts, import-validation.ts, schemas.ts
```

Why the repository layer: the in-memory store is what the assignment asks for. The interface keeps services from knowing how data is stored, so a database implementation could replace it later. The interface is intentionally small: only what the rules need.

Trade-off to be honest about: an interface does not make a swap free. A real database implementation must give the same guarantees (a transaction for transfers, a unique constraint for idempotency keys, locking or constraints so stock cannot go negative under concurrency). The interface describes the contract. It does not provide the guarantee.

## Suggested folder layout

```
src/
  app/
    (app)/layout.tsx           sidebar, store switcher, user switcher
    (app)/page.tsx             products list (Server Component, prefetches)
    (app)/products/[id]/page.tsx
    (app)/import/page.tsx      role check on the server
    api/...                    route handlers
  components/
    ui/                        shadcn
    products/ detail/ import/ adjust/   feature components
  lib/
    domain/                    pure, shared, unit-tested
    server/
      http/                    withApi wrapper, errors
      repo/                    interface + in-memory
      services/
      seed/                    loader
    client/                    api client, query keys, hooks
data/seed.json
scripts/generate-seed.ts       deterministic seed generator (seeded PRNG)
e2e/
```

## Shared domain rules (pure functions)

- `getStatus(onHand, reorderLevel)`: `out` if onHand is 0; `low` if onHand > 0 and onHand <= reorderLevel; otherwise `in_stock`. A reorder level of 0 can therefore never be Low.
- `checkAdjustment(currentStock, type, qty)`: qty must be a whole number > 0; sell, write-off and transfer cannot take stock below 0.
- `planTransfer(from, to, qty)`: returns the two movements. Invariant: the sum of the two signed quantities is 0.
- `can(role, action)`: one policy table used by the server (authority) and the UI (lock or hide).
- `validateImportRow(row, context)`: one function with a list of error codes. The browser uses it for preview, the server runs it again and decides.

## Request wrapper

Every route is wrapped with `withApi(handler, options)`, which does:

1. Waits about 500 ms (`SIMULATED_LATENCY_MS`, default 500).
2. If `?fail=1`, returns a 500 `INTERNAL_ERROR` before any state is touched.
3. Reads the role from the cookie (missing or invalid means `staff`, the least privilege).
4. Checks `options.action` against `can(role, action)` and returns 403 `FORBIDDEN`.
5. Runs the handler and maps thrown `AppError`s and `ZodError`s to the standard error shape.

Having one wrapper means the error format, delay and fail switch cannot drift between routes.

## First render and TanStack Query

1. The page is a Server Component. It reads search params, creates a `QueryClient` and calls `prefetchQuery` with the same query key and the same service function the API route uses (no HTTP hop to itself).
2. It wraps the client component in `<HydrationBoundary state={dehydrate(queryClient)}>`.
3. The client component calls `useQuery` with the same key, so it renders instantly from the hydrated cache and refetches by normal rules afterwards.
4. If the prefetch fails (for example `?fail=1` on the page URL), the failed query is not dehydrated. The client then fetches by itself and shows the real error state with a retry button.
5. Query keys are built in one file (`lib/client/query-keys.ts`) from the normalised URL params, so server and client always agree.

## Writes and cache updates

- `useMutation` for adjustments. On success, invalidate: product list queries, summary, product detail, stock-by-store, movements and the chart for that product. The dialog shows the new numbers from the mutation response.
- Optimistic updates are not used. Stock rules live on the server, so we wait for the server answer.

## Idempotency

- Required `Idempotency-Key` header on adjustments and on import commit.
- The server stores `key -> { requestHash, status, body }` in the repository, in the same critical section as the stock change.
- Same key and same payload: return the stored response (same status code) with header `Idempotent-Replay: true`. Nothing is applied twice.
- Same key and a different payload: 422 `IDEMPOTENCY_KEY_REUSED`.
- The check and the write happen with no `await` between them, so two parallel requests with the same key cannot both apply.
- Client: one key is created for a submit attempt and reused for retries of the same payload. A new key is created after success or after the user edits the form. The submit button is disabled while the request is in flight.

## Transfer consistency

- A transfer has a shared `transferId` on both movements: `transfer_out` (negative) and `transfer_in` (positive).
- The service validates everything first (qty, same store, source stock), then applies both stock changes and both movements inside `repo.transaction(fn)`.
- In-memory implementation: `fn` runs synchronously (no `await` inside), so no other request can interleave in single-threaded JS. Touched rows are captured first and restored if anything throws, so it is all or nothing.
- Unit tests: total stock across stores is unchanged by a transfer, and a failure in the middle leaves both stores untouched.

## In-memory store details

- The store is kept on `globalThis` so Next.js dev hot reload does not reset it on every edit.
- Data is reset on server restart (accepted by the brief).
- Limitation to write in the README: on Vercel, each serverless instance has its own memory. Two requests can land on different instances and see different state, and instances are recycled. This is fine for a demo, not for production. A real version needs a database.
- E2E seam: a reset route restores the seed (see `docs/API.md`).

## Permissions: why both places

- UI: a locked control with an explanation is better UX than a hidden one that fails later, and Staff should see what exists.
- Server: the UI can be bypassed (devtools, curl). The server is the only real enforcement, so every write route calls `can()` through `withApi`.
- Both use the same `can()` function so the rules cannot disagree.

## Seed data

- `scripts/generate-seed.ts` writes `data/seed.json` using a seeded PRNG, so the data is stable between runs.
- About 250 products, 6 stores, stock per store, reorder level per store, 30+ days of movements per product that add up to the current stock.
- Must include on purpose: out of stock, low stock, reorder level 0, a product with no movements, a product with a single history point, and a couple of products with a long name.

## Contracts (for test-first work)

Exact names and paths. The Tester writes tests against these before the code exists, so the Builder must not rename or move them without telling the author. Adding exports is fine.

```
src/lib/domain/errors.ts
  type ErrorCode = "INVALID_JSON" | "IDEMPOTENCY_KEY_REQUIRED" | "FORBIDDEN" | "PRODUCT_NOT_FOUND"
    | "STORE_NOT_FOUND" | "INSUFFICIENT_STOCK" | "VALIDATION_ERROR" | "IDEMPOTENCY_KEY_REUSED"
    | "IMPORT_TOO_LARGE" | "INTERNAL_ERROR"
  type FieldError = { field: string; code: string; message: string }
  class AppError extends Error { constructor(code: ErrorCode, status: number, message: string, fieldErrors?: FieldError[]) }

src/lib/domain/status.ts
  type StockStatus = "in_stock" | "low" | "out"
  getStatus(onHand: number, reorderLevel: number): StockStatus

src/lib/domain/money.ts
  parseMoneyToSen(input: string): number | null        // "68.00" -> 6800, "RM 68" -> 6800, "68.005" -> null
  formatMoney(sen: number, options?: { withCurrency?: boolean }): string   // "68.00" or "RM 68.00"

src/lib/domain/policy.ts
  type Role = "manager" | "staff"
  type Action = "view" | "receive" | "sell" | "write_off" | "transfer" | "import"
  can(role: Role, action: Action): boolean

src/lib/domain/stock-rules.ts
  type MovementType = "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in" | "import"
  type MovementDraft = { productId: string; storeId: string; type: MovementType;
    quantity: number /* signed */; balanceAfter: number; reason?: string; transferId?: string }
  isValidQuantity(quantity: number): boolean            // whole number > 0
  canRemoveStock(onHand: number, quantity: number): boolean
  planTransfer(input: { productId: string; from: { storeId: string; onHand: number };
    to: { storeId: string; onHand: number }; quantity: number; transferId: string }
  ): { out: MovementDraft; in: MovementDraft }
    // throws AppError INSUFFICIENT_STOCK (409) or VALIDATION_ERROR with SAME_STORE (422)

src/lib/domain/import-validation.ts
  type ImportField = "sku" | "name" | "category" | "quantity" | "unitCost" | "reorderLevel"
  type ImportErrorCode = "MISSING_REQUIRED" | "INVALID_QUANTITY" | "INVALID_UNIT_COST" | "INVALID_SKU"
    | "UNKNOWN_CATEGORY" | "DUPLICATE_SKU_IN_FILE" | "NAME_TOO_LONG" | "INVALID_REORDER_LEVEL"
  type ImportContext = { rowNumber: number; mapping: Partial<Record<ImportField, string>>;
    categories: readonly string[]; existingSkus: ReadonlySet<string>;
    duplicateSkuRows: ReadonlyMap<string, readonly number[]> }   // SKU -> row numbers, only SKUs seen more than once
  type ImportRowError = { code: ImportErrorCode; field: ImportField; message: string }
  type ImportRowResult = { rowNumber: number; status: "valid" | "invalid"; action?: "create" | "update";
    data?: { sku: string; name: string; category: string; quantity: number; unitCostSen: number; reorderLevel?: number };
    errors: ImportRowError[] }
  validateImportRow(row: Record<string, string>, context: ImportContext): ImportRowResult

src/lib/domain/schemas.ts
  adjustmentSchema, productListQuerySchema, importRequestSchema (Zod); type Adjustment = z.infer<typeof adjustmentSchema>

src/lib/server/services/inventory.service.ts
  type AdjustmentResult = { movements: MovementDraft[] /* saved, with id and createdAt */; stock: { storeId: string; onHand: number }[] }
  createAdjustment(input: Adjustment, ctx: { role: Role; idempotencyKey: string }): Promise<AdjustmentResult>
```
