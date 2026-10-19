# Architecture

## Goals

- Business rules in one place, testable without HTTP.
- The server is the authority for permissions and validation. The browser may preview.
- Storage is swappable later, without rewriting the rules.
- Small enough to explain in a 60 to 90 minute code walkthrough.

## Layers

```
Route Handlers (src/app/api/**/route.ts)
  parse input (Zod schemas) -> authorize -> call service -> map errors to the standard error shape
        |
Services (src/server/services)
  inventory: adjustments, transfer, idempotency
  products:  list, detail, summary, stock history
  imports (planned, not built yet): validate rows, commit rows
        |
Repositories (src/server/repositories)
  Repository interface + InMemory implementation, seeded from data/seed.json

Shared domain and helpers (src/domain, src/helpers), used by server AND client:
  domain: errors.ts, status.ts, policy.ts, stockRules.ts, importValidation.ts (planned, not built yet)
  helpers: money.ts, dates.ts
  schemas: src/schemas/
  types: src/types/
  constants: src/constants/
```

Why the repository layer: the in-memory store is what the assignment asks for. The interface keeps services from knowing how data is stored, so a database implementation could replace it later. The interface is intentionally small: only what the rules need.

Trade-off to be honest about: an interface does not make a swap free. A real database implementation must give the same guarantees (a transaction for transfers, a unique constraint for idempotency keys, locking or constraints so stock cannot go negative under concurrency). The interface describes the contract. It does not provide the guarantee.

## Suggested folder layout (target layout, migration in progress)

```
src/
  app/                         routes only (Next.js App Router)
    (app)/layout.tsx           sidebar, store switcher, user switcher
    (app)/page.tsx             products list (Server Component, prefetches)
    (app)/products/[id]/page.tsx
    (app)/import/page.tsx      role check on the server
    api/...                    route handlers
  api/                         HTTP client
  components/
    ui/                        shadcn (kebab-case)
    icons/                     Figma SVGs
    common/                    shared components
    layout/                    shell, sidebar, nav
    <feature>/                 feature components (PascalCase folders if >1 file)
  config/                      app configuration
  constants/                   fixed values as const, queryKeys.ts
  schemas/                     Zod schemas
  types/                       shared data shapes
  domain/                      pure business rules (errors, status, policy, stockRules)
  helpers/                     pure helpers (money, dates)
  hooks/                       React hooks (+ hooks/api)
  providers/                   context providers (QueryClientProvider)
  server/
    http/                      withApi wrapper, errors
    repositories/              repository interfaces and implementations
    services/                  business services (inventory, products)
    session/                   cookie session management
Outside src:
  tests/                       setup, helpers, shared mocks
  e2e/                         Playwright specs
  data/                        seed.json
scripts/generate-seed.ts       deterministic seed generator (seeded PRNG)
```

## Shared domain rules (pure functions)

- `getStatus(onHand, reorderLevel)`: `out` if onHand is 0; `low` if onHand > 0 and onHand <= reorderLevel; otherwise `in_stock`. A reorder level of 0 can therefore never be Low.
- `checkAdjustment(currentStock, type, qty)`: qty must be a whole number > 0; sell, write-off and transfer cannot take stock below 0.
- `planTransfer(from, to, qty)`: returns the two movements. Invariant: the sum of the two signed quantities is 0.
- `roleHasPermission(role, permission)`: one policy table used by the server (authority) and the UI (lock or hide).
- `validateImportRow(row, context)`: one function with a list of error codes. The browser uses it for preview, the server runs it again and decides.

## Request wrapper

Every route is wrapped with `withApi(handler, options)`, which does:

1. Waits about 500 ms (`SIMULATED_LATENCY_MS`, default 500).
2. If `?fail=1`, returns a 500 `INTERNAL_ERROR` before any state is touched.
3. Reads the user from the cookie `stockroom_user` and takes the role from the server's user list (missing or unknown means the default Staff user, the least privilege).
4. Checks `options.permission` against `roleHasPermission(role, permission)` and returns 403 `FORBIDDEN`.
5. Runs the handler and maps thrown `AppError`s and `ZodError`s to the standard error shape (`VALIDATION_ERROR`, 422), mapping Zod issues to documented field codes (`REQUIRED`, `NOT_A_WHOLE_NUMBER`, `MUST_BE_POSITIVE`, `TOO_SHORT`, `TOO_LONG`, `VALIDATION_ERROR`).

Having one wrapper means the error format, delay and fail switch cannot drift between routes.

## First render and TanStack Query

1. The page is a Server Component. It reads search params, creates a `QueryClient` and calls `prefetchQuery` with the same query key and the same service function the API route uses (no HTTP hop to itself).
2. It wraps the client component in `<HydrationBoundary state={dehydrate(queryClient)}>`.
3. The client component calls `useQuery` with the same key, so it renders instantly from the hydrated cache and refetches by normal rules afterwards.
4. If the prefetch fails (for example `?fail=1` on the page URL), the failed query is not dehydrated. The client then fetches by itself and shows the real error state with a retry button.
5. Query keys are built in `src/constants/queryKeys.ts` from the normalised URL params, so server and client always agree.

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
- Server: the UI can be bypassed (devtools, curl). The server is the only real enforcement, so every write route calls `roleHasPermission()` through `withApi`.
- Both use the same `roleHasPermission()` function so the rules cannot disagree.

## Seed data

- `scripts/generate-seed.ts` writes `data/seed.json` using a seeded PRNG, so the data is stable between runs.
- 248 products, 6 stores, 6 categories, 7 suppliers, 3 users. A product is "carried" at a store when it has a stock row there, with its own on hand and reorder level. Mont Kiara carries exactly 212 products, the other stores a similar share (the design shows 212 and 248).
- 90 days of movements per product that add up to the current stock (the chart ranges are 7, 30 and 90 days). Movements have a note and the user who made them, and transfers come as linked pairs.
- Seed freshness: at load time (skipped in test mode `NODE_ENV === "test"`), movement timestamps are rebased by whole days so that the newest movement is today in `Asia/Kuala_Lumpur` timezone, ensuring chart ranges and recent movements stay fresh.
- Fixtures taken from the design, used in tests: KL-1042 Arabica beans 1 kg (Coffee, Highland Roasters, 6800 sen; Mont Kiara 18, Subang 4, Cheras 0, Damansara 22, Puchong 15, Shah Alam 25; reorder level 5 everywhere, so 84 on hand and 30 reorder in total); KL-1043 Robusta beans 1 kg; KL-2210 Oat milk 1 L (out of stock everywhere).
- Must include on purpose: out of stock, low stock, reorder level 0, a product with no movements, a product with one history point, a product not carried at some stores, two long names.

## Contracts (for test-first work)

Types live in `src/types/` (one file per module, rules in `docs/CONVENTIONS.md` section 3). Functions live in the files listed below. These are the exact names and paths: do not rename or move them without telling the author. Adding exports is fine.

### Types

```
src/types/common.ts
  type ErrorCode = "INVALID_JSON" | "IDEMPOTENCY_KEY_REQUIRED" | "FORBIDDEN" | "PRODUCT_NOT_FOUND"
    | "STORE_NOT_FOUND" | "NOT_STOCKED_AT_STORE" | "INSUFFICIENT_STOCK" | "VALIDATION_ERROR"
    | "IDEMPOTENCY_KEY_REUSED" | "IMPORT_TOO_LARGE" | "FILE_TOO_LARGE" | "INVALID_FILE" | "INTERNAL_ERROR"
  type FieldError = { field: string; code: string; message: string }
  type ApiErrorBody = { error: ErrorCode; message: string; fieldErrors: FieldError[] }
  type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number }
  type PageSize = 25 | 50 | 100
  type SortDirection = "asc" | "desc"
  type IconProps = SVGProps<SVGSVGElement>
  type IconComponent = (props: IconProps) => ReactElement

src/types/store.ts
  type StoreId = string                       // kebab-case slug, for example "mont-kiara"
  type Store = { id: StoreId; name: string }
  type StoreScope = "all" | StoreId

src/types/user.ts
  type Role = "manager" | "staff"
  type Permission = "view" | "receive" | "sell" | "write_off" | "transfer" | "import"
  type User = { id: string; name: string; initials: string; role: Role }

src/types/product.ts
  type StockStatus = "in_stock" | "low" | "out"
  type ProductSortKey = "updatedAt" | "sku" | "name" | "category" | "onHand" | "reorderLevel" | "unitCostSen" | "status"
  type ProductListQuery = z.infer<typeof productListQuerySchema>   // store, q, category, status, sort, dir, page, pageSize
  type ProductListItem = { id: string; sku: string; name: string; category: string; supplier: string;
    unitCostSen: number; onHand: number; reorderLevel: number; status: StockStatus; updatedAt: string }
  type ProductListSummary = { totalProducts: number; stockValueSen: number; lowStock: number; outOfStock: number }
  type ProductListResponse = Paginated<ProductListItem> & { summary: ProductListSummary }
  type StockByStore = { storeId: StoreId; onHand: number; reorderLevel: number; status: StockStatus; lastMovementAt: string | null }
  type ProductDetail = { id: string; sku: string; name: string; category: string; supplier: string; unitCostSen: number;
    onHand: number; reorderLevel: number; status: StockStatus; stockValueSen: number;
    lastMovementAt: string | null; stockByStore: StockByStore[] }
  type StockHistoryPoint = { date: string; onHand: number }
  type StockHistory = { points: StockHistoryPoint[]; reorderLevel: number }

src/types/movement.ts
  type MovementType = "receive" | "sell" | "write_off" | "transfer_out" | "transfer_in" | "import"
  type MovementDraft = { productId: string; storeId: StoreId; type: MovementType;
    quantity: number /* signed */; balanceAfter: number; note?: string; transferId?: string }
  type Movement = MovementDraft & { id: string; createdAt: string;
    by: { id: string; name: string; initials: string }; counterpartStoreId?: StoreId }
  type MovementPeriod = "7d" | "30d" | "90d"
  type MovementListResponse = Paginated<Movement>

src/types/adjustment.ts
  type Adjustment = z.infer<typeof adjustmentSchema>
  type AdjustmentResult = { movements: Movement[]; stock: { storeId: StoreId; onHand: number }[] }

src/types/import.ts
  type ImportField = "sku" | "name" | "category" | "quantity" | "unitCost"
  type ImportErrorCode = "MISSING_REQUIRED" | "INVALID_QUANTITY" | "INVALID_UNIT_COST" | "INVALID_SKU"
    | "UNKNOWN_CATEGORY" | "DUPLICATE_SKU_IN_FILE" | "NAME_TOO_LONG"
  type ImportContext = { rowNumber: number; mapping: Partial<Record<ImportField, string>>;
    categories: readonly string[]; existingSkus: ReadonlySet<string>;
    duplicateOfRow?: number }                 // set when an earlier row had the same SKU: the number of that first row
  type ImportRowError = { code: ImportErrorCode; field: ImportField; message: string }
  type ImportRowResult = { rowNumber: number; status: "valid" | "invalid"; action?: "create" | "update";
    data?: { sku: string; name: string; category: string; quantity: number; unitCostSen: number };
    errors: ImportRowError[] }
```

### Functions

```
src/domain/errors.ts
  class AppError extends Error { constructor(code: ErrorCode, status: number, message: string, fieldErrors?: FieldError[]) }

src/domain/status.ts
  getStatus(onHand: number, reorderLevel: number): StockStatus   // also used by the browser for the dialog preview

src/helpers/money.ts
  parseMoneyToSen(input: string): number | null        // "68.00" -> 6800, "RM 68" -> 6800, "68.005" -> null
  formatMoney(sen: number, options?: { withCurrency?: boolean }): string   // "68.00", "RM 68.00", "1,234.50"

src/domain/policy.ts
  roleHasPermission(role: Role, permission: Permission): boolean

src/domain/stockRules.ts
  isValidQuantity(quantity: number): boolean            // whole number > 0
  canRemoveStock(onHand: number, quantity: number): boolean
  planTransfer(input: { productId: string; from: { storeId: StoreId; onHand: number };
    to: { storeId: StoreId; onHand: number }; quantity: number; transferId: string }
  ): { out: MovementDraft; in: MovementDraft }
    // throws AppError INSUFFICIENT_STOCK (409) or VALIDATION_ERROR with SAME_STORE (422)

src/domain/importValidation.ts (planned, not built yet)
  validateImportRow(row: Record<string, string>, context: ImportContext): ImportRowResult

src/helpers/dates.ts
  formatWhen(date: Date | string, now: Date): string    // "2h ago", "Today, 09:10", "Yesterday", "12 Oct"
  formatDateTime(date: Date | string): string          // "14 Oct, 10:58"

src/schemas/
  adjustmentSchema, productListQuerySchema, importRequestSchema (Zod)

src/server/services/importsService.ts (planned, not built yet)
  parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] }   // papaparse on the server, header row required

src/server/services/inventory/createAdjustment.ts
  createAdjustment(input: Adjustment, ctx: { role: Role; idempotencyKey: string }): Promise<AdjustmentResult>
```
