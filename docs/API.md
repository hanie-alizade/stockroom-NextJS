# API

All routes live under `/api`, built with Next.js Route Handlers (`src/app/api/**/route.ts`). Every route is wrapped by `withApi` (see `docs/ARCHITECTURE.md`): about 500 ms delay (`SIMULATED_LATENCY_MS`), `?fail=1` forces a 500, the user comes from the cookie.

A product's `id` in every response and every URL is its SKU (for example `KL-1042`). Store ids are kebab-case slugs (`mont-kiara`).

## Headers

| Header                | Direction | Used by                                   | Meaning                                                    |
| --------------------- | --------- | ----------------------------------------- | ---------------------------------------------------------- |
| `Idempotency-Key`     | request   | `POST /api/products/:id/adjustments`, `POST /api/imports/commit` | Required. A UUID per submit attempt (see Idempotency) |
| `Idempotent-Replay`   | response  | the same two routes                       | `true` when the stored result of an earlier call is returned |

## Session

- Cookie `stockroom_user` holds a user id (`aina-rahman`, `faiz-hakim`, `mei-ling`). The role (`manager` or `staff`) is always derived by the server from the user list, never from the client.
- Missing or unknown cookie falls back to the default Staff user `faiz-hakim` (least privilege).
- Cookie options: path `/`, `httpOnly`, `sameSite: lax`, `secure` in production.

### POST `/api/session`

Body: `{ "userId": "aina-rahman" }`

Response 200: `{ "user": { "id", "name", "initials", "role" } }`. Sets the cookie.

Errors: 400 `INVALID_JSON` (body is not parseable JSON); 422 `VALIDATION_ERROR` with `[{ "field": "userId", "code": "UNKNOWN_USER", "message": "Unknown user." }]` (the cookie is not set).

## Error format (everywhere)

```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Mont Kiara only has 18 on hand. Enter 18 or less.",
  "fieldErrors": [{ "field": "quantity", "code": "TOO_MANY", "message": "Only 18 on hand." }]
}
```

- `error`: stable code. The frontend branches on this only.
- `message`: human readable, safe to show.
- `fieldErrors`: always present, empty array when not relevant.

## Codes and status codes

| Status | `error`                    | When                                                                                                              |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 400    | `INVALID_JSON`             | Body is not parseable JSON                                                                                        |
| 400    | `IDEMPOTENCY_KEY_REQUIRED` | Missing or empty `Idempotency-Key` on a route that needs it                                                       |
| 403    | `FORBIDDEN`                | Role cannot do this action (Staff write-off, transfer, import)                                                    |
| 404    | `PRODUCT_NOT_FOUND`        | Unknown product id                                                                                                |
| 404    | `STORE_NOT_FOUND`          | Unknown store id                                                                                                  |
| 409    | `INSUFFICIENT_STOCK`       | Sell, write-off or transfer would take a store below 0                                                            |
| 413    | `FILE_TOO_LARGE`           | Import file over 5 MB                                                                                             |
| 422    | `NOT_STOCKED_AT_STORE`     | The product is not carried at that store                                                                          |
| 422    | `VALIDATION_ERROR`         | Body or query failed validation (see `fieldErrors`), including same-store transfer and a write-off without a note |
| 422    | `IDEMPOTENCY_KEY_REUSED`   | Same key, different payload                                                                                       |
| 422    | `INVALID_FILE`             | Import file is not a readable CSV, is empty, or has no header row                                                 |
| 422    | `IMPORT_TOO_LARGE`         | More rows than the limit (2000)                                                                                   |
| 500    | `INTERNAL_ERROR`           | Unexpected error, or forced with `?fail=1`                                                                        |

<<<<<<< Updated upstream
Field error codes used inside `fieldErrors`: `REQUIRED`, `NOT_A_WHOLE_NUMBER`, `MUST_BE_POSITIVE`, `TOO_MANY`, `SAME_STORE`, `UNKNOWN_STORE`, `TOO_LONG`, `TOO_SHORT`.
=======
Field error codes used inside `fieldErrors`: `REQUIRED`, `NOT_A_WHOLE_NUMBER`, `MUST_BE_POSITIVE`, `TOO_MANY`, `SAME_STORE`, `UNKNOWN_STORE`, `TOO_LONG`, `TOO_SHORT`, `UNKNOWN_USER`, `VALIDATION_ERROR`.

Zod errors are mapped to these codes in one place (`withApi`). Platform responses that never reach a handler (for example HTTP 413 from the host on large uploads) are normalized by the browser client (`getErrorInfo`) to `FILE_TOO_LARGE`.
>>>>>>> Stashed changes

## Routes

### GET `/api/meta`

Stores, categories and users for the switchers and filters. A store is `{ id, name }`. A user is `{ id, name, initials, role }`.

Response: `{ stores, categories, users, currentUser }`. `currentUser` is the user derived from the cookie (or the default Staff user).

### GET `/api/products`

Query: `store` (`all` or a store id, default `all`), `q`, `category`, `status` (`in_stock` | `low` | `out`), `sort` (`updatedAt` | `sku` | `name` | `category` | `onHand` | `reorderLevel` | `unitCostSen` | `status`), `dir` (`asc` | `desc`), `page`, `pageSize` (25, 50 or 100; default 25). Default is `sort=updatedAt&dir=desc`. The client turns "sort off" into omitting both params.

Response:

```json
{
  "items": [
    {
      "id": "KL-1042",
      "sku": "KL-1042",
      "name": "Arabica beans 1 kg",
      "category": "Coffee",
      "supplier": "Highland Roasters",
      "unitCostSen": 6800,
      "onHand": 84,
      "reorderLevel": 30,
      "status": "in_stock",
      "updatedAt": "2026-10-15T08:30:00Z"
    }
  ],
  "page": 1,
<<<<<<< Updated upstream
  "pageSize": 10,
  "total": 247,
  "summary": { "totalProducts": 250, "stockValueSen": 18452300, "lowStock": 31, "outOfStock": 9 }
=======
  "pageSize": 25,
  "total": 248,
  "summary": { "totalProducts": 248, "stockValueSen": 18243050, "lowStock": 17, "outOfStock": 6 }
>>>>>>> Stashed changes
}
```

- A product belongs to a store scope only if it is carried (has a stock row) there. `totalProducts` counts those products. With `store=all` that is every product with stock in at least one store.
- With `store=all`, `onHand` and `reorderLevel` are sums across the stores that carry it, and `status` is calculated from those sums.
- `summary` follows the store scope and ignores search, category, status and paging (see `docs/DECISIONS.md`). `stockValueSen` is the sum of `onHand` times `unitCostSen` over the scope.
- `updatedAt` is the time of the latest movement in the scope (or the product creation time when there is none).
- Sorting by `status`: `dir=desc` gives Out, Low, In stock (most urgent first), `asc` reverses it. Ties are broken by SKU.
- Search is case-insensitive on name and SKU.
- `supplier` is `null` for products created by import.

### GET `/api/products/:id`

<<<<<<< Updated upstream
Query: `store`. Returns product details (including `supplier`, `stockValueSen` and `lastMovementAt` for the scope), totals for the scope, and `stockByStore`: one entry per store that carries the product, with `storeId`, `onHand`, `reorderLevel`, `status`, `lastMovementAt`.

### GET `/api/products/:id/movements`

Query: `store`, `type` (`receive` | `sell` | `write_off` | `transfer_out` | `transfer_in` | `import`), `period` (`7d` | `30d` | `90d`, default `30d`), `page`, `pageSize` (25, 50 or 100). Newest first. The response also has `total` (the count shown on the tab).
=======
Query: `store`. Returns product details (including `supplier`, `stockValueSen` and `lastMovementAt` for the scope), totals for the scope, and `stockByStore`: one entry per store that carries the product, with `storeId`, `onHand`, `reorderLevel`, `status`, `lastMovementAt`. When the product is not carried at the requested store, `stockByStore` is empty (the page shows a notice instead of zeros). Unknown product returns 404 `PRODUCT_NOT_FOUND`.

### GET `/api/products/:id/movements`

Query: `store`, `type` (`receive` | `sell` | `write_off` | `transfer_out` | `transfer_in` | `import`), `period` (`7d` | `30d` | `90d`, default `30d`), `page`, `pageSize` (25, 50 or 100; default 25; any other pageSize is 422 `VALIDATION_ERROR`). Always paginated. Newest first. The response also has `total` (the count shown on the tab). Unknown product returns 404 `PRODUCT_NOT_FOUND`.
>>>>>>> Stashed changes

Movement:

```json
{
  "id": "m_123",
  "productId": "KL-1042",
  "storeId": "mont-kiara",
  "type": "transfer_out",
  "quantity": -5,
  "balanceAfter": 13,
  "note": null,
  "transferId": "t_77",
  "counterpartStoreId": "subang",
  "createdAt": "2026-10-15T08:30:00Z",
  "by": { "id": "aina-rahman", "name": "Aina Rahman", "initials": "AR" }
}
```

### GET `/api/products/:id/stock-history`

<<<<<<< Updated upstream
Query: `store`, `days` (`7`, `30` or `90`; default 30). Daily end-of-day stock rebuilt from movements, going backwards from the current stock. Only real points are returned (a brand new product returns one point).

Response: `{ "points": [ { "date": "2026-10-14", "onHand": 18 } ], "reorderLevel": 40 }`. `reorderLevel` is the sum of the reorder levels of the stores in the scope (the dashed line).
=======
Query: `store`, `days` (`7`, `30` or `90`; default 30; anything else is 422 `VALIDATION_ERROR`). Daily end-of-day stock rebuilt from movements, going backwards from the current stock. Unknown product returns 404 `PRODUCT_NOT_FOUND`.

Response: `{ "points": [ { "date": "2026-10-14", "onHand": 18 } ], "reorderLevel": 30, "days": 30 }`. `reorderLevel` is the sum of the reorder levels of the stores in the scope (the dashed line).
>>>>>>> Stashed changes

### POST `/api/products/:id/adjustments`

Headers: `Idempotency-Key: <uuid>` (required). Role: Receive and Sell for everyone, Write-off and Transfer for Manager only. A store must carry the product, else 422 `NOT_STOCKED_AT_STORE`.

Body (discriminated union on `type`):

```json
{ "type": "receive",   "storeId": "mont-kiara", "quantity": 10 }
{ "type": "sell",      "storeId": "mont-kiara", "quantity": 2 }
{ "type": "write_off", "storeId": "mont-kiara", "quantity": 1, "note": "Expired" }
{ "type": "transfer",  "fromStoreId": "mont-kiara", "toStoreId": "subang", "quantity": 5, "note": "Rebalancing" }
```

Rules (the server enforces all of them):

- `quantity`: whole number, greater than 0.
- Sell, write-off and transfer cannot take the source below 0, else 409 `INSUFFICIENT_STOCK` with a message like `Mont Kiara only has 18 on hand. Enter 18 or less.` Exactly the stock on hand is allowed (result 0).
- `note`: required for write-off (trimmed, 3 to 200 characters); optional for the other types (up to 200 characters).
- Both transfer movements carry the same `note`.
- Transfer: `fromStoreId` must differ from `toStoreId`, else 422 `VALIDATION_ERROR` with a `SAME_STORE` field error.
- Transfer creates two movements (`transfer_out`, `transfer_in`) with the same `transferId`, in one transaction.

Order of checks (matters when several things are wrong at once): 1) body is valid JSON and matches the Zod schema (422 on failure); 2) `Idempotency-Key` present (400); 3) role may do this type (403); 4) product exists (404); 5) quantity, note and same-store rules; 6) inside the transaction: replay check, store carries the product, enough stock.

Known gap: step 1 runs before step 3, so a Staff request with an invalid write-off body (for example no reason) gets 422, not 403. A valid Staff write-off or transfer gets 403. Moving the type-based permission check before the field validation would close this (see `docs/DECISIONS.md`).

Response 201:

```json
{ "movements": [ ... ], "stock": [ { "storeId": "mont-kiara", "onHand": 13 }, { "storeId": "subang", "onHand": 9 } ] }
```

A replay of the same key and payload returns the same body with status 201, plus `Idempotent-Replay: true`. The same key with a different payload returns 422 `IDEMPOTENCY_KEY_REUSED`.

### POST `/api/imports/validate`

Manager only (`withApi` permission `import`, 403 for Staff). Stateless: the request sends the file and the mapping, and the server parses and validates everything.

<<<<<<< Updated upstream
Body: `multipart/form-data` with `file` (the CSV, at most 5 MB, else 413 `FILE_TOO_LARGE`; unreadable or no header, else 422 `INVALID_FILE`), `storeId`, and `mapping` (JSON text such as `{ "sku": "Item code", ... }`). The server parses the CSV itself (header row, empty lines skipped, at most 2000 rows).

Response 200:

```json
{ "summary": { "total": 60, "valid": 53, "invalid": 7, "willCreate": 12, "willUpdate": 41 },
  "rows": [ { "rowNumber": 2, "status": "valid", "action": "update", "data": { ... }, "errors": [] },
            { "rowNumber": 9, "status": "invalid", "errors": [ { "code": "INVALID_QUANTITY", "field": "quantity", "message": "..." } ] } ] }
=======
Body: `multipart/form-data` with:

- `file`: the CSV file (at most 5 MB, else 413 `FILE_TOO_LARGE`; unreadable, empty or no header, else 422 `INVALID_FILE`; more than 2000 data rows, else 422 `IMPORT_TOO_LARGE`).
- `storeId`: target store id (unknown store returns 404 `STORE_NOT_FOUND`).
- `mapping`: JSON text such as `{ "sku": "Item code", "name": "Description", "category": "Group", "quantity": "Qty", "unitCost": "Cost (RM)" }`. All five fields must be mapped and no column may be used twice, else 422 `VALIDATION_ERROR`.

Response 200. Every row, valid or not, carries `values` (raw mapped strings) so the UI can highlight bad cells without repeating the mapping:

```json
{
  "summary": { "total": 63, "valid": 55, "invalid": 8, "willCreate": 15, "willUpdate": 40 },
  "rows": [
    {
      "rowNumber": 1,
      "status": "valid",
      "action": "update",
      "values": { "sku": "KL-1042", "name": "Arabica beans 1 kg", "category": "Coffee", "quantity": "25", "unitCost": "68.00" },
      "data": { "sku": "KL-1042", "name": "Arabica beans 1 kg", "category": "Coffee", "quantity": 25, "unitCostSen": 6800 },
      "errors": []
    },
    {
      "rowNumber": 9,
      "status": "invalid",
      "values": { "sku": "BAD-1", "name": "Bad Item", "category": "Coffee", "quantity": "-5", "unitCost": "10.00" },
      "errors": [{ "code": "INVALID_QUANTITY", "field": "quantity", "message": "Quantity can't be negative" }]
    }
  ]
}
>>>>>>> Stashed changes
```

Nothing is saved by this route.

### POST `/api/imports/commit`

<<<<<<< Updated upstream
Manager only. `Idempotency-Key` required. Same body as validate (the file is sent again). The server validates again, applies the valid rows in one transaction, skips invalid ones and returns:

```json
{ "created": 12, "updated": 40, "unchanged": 1, "skipped": 7, "skippedRows": [ { "rowNumber": 9, "errors": [ ... ] } ] }
=======
Manager only. `Idempotency-Key` required (missing key returns 400 `IDEMPOTENCY_KEY_REQUIRED`). Same multipart body as validate (the file is sent again). The server validates again, applies all valid rows in ONE transaction, skips invalid ones, writes `import` movements when the quantity delta is not 0, and stores the result under the idempotency key. Replaying the same key and request returns 200 with `Idempotent-Replay: true`. Reusing the key with a different payload returns 422 `IDEMPOTENCY_KEY_REUSED`.

Response 200:

```json
{
  "created": 15,
  "updated": 39,
  "unchanged": 1,
  "skipped": 8,
  "skippedRows": [
    { "rowNumber": 9, "errors": [{ "code": "INVALID_QUANTITY", "field": "quantity", "message": "Quantity can't be negative" }] }
  ]
}
>>>>>>> Stashed changes
```

### POST `/api/test/reset`

Only available when `NODE_ENV` is `development` or `E2E=1`; otherwise 404. Restores the seed data. Response 200: `{ "success": true }`. Used by Playwright and handy in Postman locally.

## Idempotency

- The key is stored in the repository as `key -> { requestHash, status, body }`. The hash is SHA-256 of the canonical JSON (sorted keys) of the product id and the request body.
- The lookup and the write happen in one synchronous transaction with no `await` between them.
- The key is global, not per user. Use a fresh UUID per submit attempt.

## Calling the API without the UI

The cookie decides the role. With curl: `-H "Cookie: stockroom_user=aina-rahman"` for Manager, `faiz-hakim` for Staff. A Postman collection is planned (Phase 8 in `docs/PLAN.md`).
