# Testing

How the tests are organised, what they cover, how to run them, and what is still missing. The brief's required tests are mapped in section 5. Writing rules are in `docs/CONVENTIONS.md` section 8.

## 1. Commands

| Command              | What it runs                                                             |
| -------------------- | ------------------------------------------------------------------------ |
| `npm test`           | Vitest: unit, route handler and hook tests (about 300 tests, 33 files)   |
| `npm test -- <path>` | one test file                                                            |
| `npm run e2e`        | Playwright: builds the app, starts it with `E2E=1`, runs `e2e/*.spec.ts` |
| `npm run check`      | typecheck, lint, repo rules and `npm test` (no e2e)                      |

First run of Playwright on a new machine: `npx playwright install chromium`.

Both suites run with one command and exit by themselves.

## 2. Layers

| Layer               | Where                                               | Style                                                                |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Domain rules        | `src/domain/__tests__`                              | pure functions, no mocks, `it.each` where it fits                    |
| Helpers             | `src/helpers/__tests__`                             | money, dates, CSV parse and build, URL state, import mapping, errors |
| Hooks               | `src/hooks/__tests__`                               | `useImportWizard` state machine                                      |
| Services            | `src/server/services/**/__tests__`                  | against the real in-memory repository, store reset in `beforeEach`   |
| Repository and seed | `src/server/repositories/__tests__`                 | seed integrity (movements add up to stock), seed rebasing            |
| HTTP wrapper        | `src/server/http/__tests__`, `src/server/__tests__` | `withApi` (delay, `?fail=1`, permission, error mapping), session     |
| Route handlers      | `src/app/api/**/__tests__/route.test.ts`            | call the exported handler with a real `Request`, cookie mocked       |
| End to end          | `e2e/*.spec.ts` (Phase 6)                           | Playwright, Chromium, real built app                                 |

Not covered by any test yet: React components (no Testing Library component tests, only the hook test uses the setup file).

## 3. Test seams

- **Reset the store.** `POST /api/test/reset` restores the seed. It answers 404 unless `NODE_ENV` is `development` or `E2E=1`. Vitest tests call `repo.reset()` directly in `beforeEach`.
- **No delay in tests.** `SIMULATED_LATENCY_MS` defaults to 500. Playwright's `webServer.env` sets it to `0` (and `E2E=1`). In Vitest only two files set it to `0` themselves (`withApi.test.ts` and the stock-history route test); every other route test waits 500 ms per request. Fix: add `env: { SIMULATED_LATENCY_MS: "0" }` to `test` in `vitest.config.ts`, then remove the per-file assignments.
- **Cookie in route tests.** `vi.mock("next/headers")` plus `mockCookies("<userId>")` from `tests/helpers`. Users: `aina-rahman` (manager), `faiz-hakim` (staff), `mei-ling` (staff).
- **Repository mock.** `mockRepository()` in `tests/helpers` for service tests that must not touch real data.
- **`server-only` stub.** Vitest aliases `server-only` to `tests/stubs/server-only.ts`.
- **Seed rebasing is off in tests.** When `NODE_ENV === "test"` the seed movements keep their original dates, so tests do not depend on today's date.
- **Playwright config.** `playwright.config.ts`: one worker, not parallel, Chromium only, `webServer.command` is `npm run build && npm run start`, `reuseExistingServer: false` (port 3000 must be free).

## 4. Fixtures

| What                    | Value                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Main product            | `KL-1042` Arabica beans 1 kg, 6800 sen. Mont Kiara 18, Subang 4, Cheras 0, Damansara 22, Puchong 15, Shah Alam 25 |
| Transfer example        | 5 units Mont Kiara to Subang gives Mont Kiara 13 and Subang 9 (used by the route test)                            |
| Not carried at a store  | `KL-1000` is carried at Mont Kiara (15) but not at Cheras (`NOT_STOCKED_AT_STORE`)                                |
| Out of stock everywhere | `KL-2210` Oat milk 1 L                                                                                            |
| Sample import file      | `samples/import-sample.csv`: 63 rows, 55 valid, 8 invalid, 15 create, 40 update (store `mont-kiara`)              |

If the seed generator changes, these numbers change. Re-run `npm test` and update the fixtures table in the same commit.

## 5. Coverage against the brief

| Brief requirement                                                           | Status                                                                                                                                                          |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests: status                                                          | done (`status.test.ts`: zero, low, boundary at reorder level, reorder level 0 is never Low, summed values)                                                      |
| Unit tests: cannot go below zero                                            | done (`canRemoveStock`, `planDirectAdjustment`, `planTransfer`, exact stock allowed)                                                                            |
| Unit tests: transfer totals                                                 | done (`planTransfer`: two movements sum to 0, same `transferId`, `balanceAfter`; same store rejected)                                                           |
| Route tests: Staff 403 for write-off                                        | done (adjustments route test)                                                                                                                                   |
| Route tests: Staff 403 for transfer                                         | service level only (`createAdjustment.test.ts`). Add a route-level test                                                                                         |
| Route tests: Staff 403 for import                                           | done (validate and commit in `imports/__tests__/route.test.ts`)                                                                                                 |
| Route tests: oversell returns the error code                                | service level only (`INSUFFICIENT_STOCK`, 409). Add a route-level test                                                                                          |
| CSV row validation, at least five kinds of problem                          | done (`importValidation.test.ts`: missing field, invalid SKU, name too long, invalid quantity, invalid unit cost, unknown category, duplicate SKU, error order) |
| CSV sample file counts                                                      | done (`importsService.test.ts`: 63 total, 55 valid, 8 invalid, 15 create, 40 update)                                                                            |
| Playwright: Manager filters, opens a product, transfers, both stores change | Phase 6                                                                                                                                                         |
| Playwright: Write-off and Transfer locked for Staff                         | Phase 6                                                                                                                                                         |

Extra tests that exist beyond the brief: idempotent replay and key reuse (service), transfer rollback when the destination does not carry the product, import commit rollback and replay, seed integrity, `withApi` behavior, session cookie, date formatting in a fixed time zone, money parsing without floats.

### Route-level gaps to close (Phase 6)

Add to `src/app/api/products/[id]/adjustments/__tests__/route.test.ts`, using `KL-1042`:

- Staff transfer returns 403 `FORBIDDEN` with the unified body.
- Staff receive and sell return 201.
- Manager oversell returns 409 `INSUFFICIENT_STOCK` and stock is unchanged.
- Same `Idempotency-Key` twice applies once and the second response has `Idempotent-Replay: true`; two parallel calls apply once.
- Write-off without a note returns 422 `VALIDATION_ERROR` with a field error for `note`.
- Unknown product returns 404 `PRODUCT_NOT_FOUND`.
- `?fail=1` returns 500 `INTERNAL_ERROR`.

## 6. Playwright plan (Phase 6)

Files in `e2e/`, names in camelCase (`managerTransfer.spec.ts`, `staffLocked.spec.ts`) and a small `helpers.ts`.

Helpers:

- `resetData(request)`: `POST /api/test/reset`, called in `test.beforeEach`.
- `switchUser(context, userId)`: sets the cookie `stockroom_user` for `localhost`. Faster and less flaky than clicking through the menu. One test may still use the UI switcher.

Locators that exist in the UI today:

- Search: placeholder `Search name or SKU`. Category and status are Select controls with placeholders `All categories` and `All statuses`.
- Product detail: button `Adjust stock`; per-row buttons named `Adjust stock at <Store>` in the "Stock by store" table.
- Dialog: title `Adjust stock`; type control is a `radiogroup` labelled `Type` with radios `Receive`, `Sell`, `Write-off`, `Transfer`. Locked radios have `aria-disabled="true"`. Fields are labelled `Quantity`, `From`, `To`, `Store`, `Note`. Swap button name: `Swap stores`.
- Sidebar: store select shows `All stores (6)` or the store name; user card has a `Switch` button; nav link `Import` is hidden for Staff.
- Staff on `/import`: redirected to `/products?notice=managers-only` with the message `Import is available to managers only`.

Test 1, Manager transfer: search `arabica` and assert the URL has `q=arabica`; open `KL-1042`; read On hand for Mont Kiara and Subang; open the dialog, choose Transfer, From Mont Kiara, To Subang, quantity 5, submit; without reloading assert 13 and 9 in "Stock by store". Optional: go back to the list and check the numbers.

Test 2, Staff locks: as `faiz-hakim` open `KL-1042`, open the dialog, assert Write-off and Transfer have `aria-disabled="true"` and Receive and Sell do not; visit `/import` and assert the redirect and the notice; optional `page.request.post` of a write-off returns 403.

Rules: web-first assertions only (the app has real latency in dev), no `waitForTimeout`, each test starts from a reset store.
