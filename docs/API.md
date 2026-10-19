# API

All routes live under `/api`, built with Next.js Route Handlers. Every route is wrapped by `withApi` (see ARCHITECTURE.md): about 500 ms delay, `?fail=1` forces a 500, role comes from the cookie.

## Session

- Cookie `stockroom_user` holds a user id (`aina-rahman`, `faiz-hakim`, `mei-ling`). The role (`manager` or `staff`) is always derived by the server from the user list, never from the client.
- Missing or unknown cookie falls back to the default Staff user `faiz-hakim` (least privilege).

### POST `/api/session`

Body: `{ userId: string }` (e.g., `{ "userId": "aina-rahman" }`)

Response 200: `{ user: { id, name, initials, role } }`

Error 400 `INVALID_JSON`: Body is not parseable JSON.

Error 422 `VALIDATION_ERROR`: Unknown user id. Field errors: `[{ field: "userId", code: "UNKNOWN_USER", message: "Unknown user." }]`. The cookie is not set in this case.

On success, the cookie `stockroom_user` is set with the user id (path `/`, httpOnly, sameSite `lax`).

## Error format (everywhere)

```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Cannot sell 12. Only 5 on hand at Bangsar.",
  "fieldErrors": [{ "field": "quantity", "code": "TOO_MANY", "message": "Only 5 on hand." }]
}
```

- `error`: stable code, the frontend branches on this only.
- `message`: human readable, safe to show.
- `fieldErrors`: always present, empty array when not relevant.

## Codes and status codes

| Status | `error`                    | When                                                                                                              |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 400    | `INVALID_JSON`             | Body is not parseable JSON                                                                                        |
| 400    | `IDEMPOTENCY_KEY_REQUIRED` | Missing `Idempotency-Key` on a route that needs it                                                                |
| 403    | `FORBIDDEN`                | Role cannot do this action (Staff write-off, transfer, import)                                                    |
| 404    | `PRODUCT_NOT_FOUND`        | Unknown product id                                                                                                |
| 404    | `STORE_NOT_FOUND`          | Unknown store id                                                                                                  |
| 422    | `NOT_STOCKED_AT_STORE`     | The product is not carried at that store                                                                          |
| 409    | `INSUFFICIENT_STOCK`       | Sell, write-off or transfer would take a store below 0                                                            |
| 422    | `VALIDATION_ERROR`         | Body or query failed validation (see `fieldErrors`), including same-store transfer and a write-off without a note |
| 422    | `IDEMPOTENCY_KEY_REUSED`   | Same key, different payload                                                                                       |
| 413    | `FILE_TOO_LARGE`           | Import file over 5 MB                                                                                             |
| 422    | `INVALID_FILE`             | Import file is not a readable CSV, or has no header row                                                           |
| 422    | `IMPORT_TOO_LARGE`         | More rows than the limit (default 2000)                                                                           |
| 500    | `INTERNAL_ERROR`           | Unexpected error, or forced with `?fail=1`                                                                        |

Field error codes used inside `fieldErrors`: `REQUIRED` (missing value), `NOT_A_WHOLE_NUMBER` (non-integer number), `MUST_BE_POSITIVE` (number <= 0), `TOO_MANY`, `SAME_STORE`, `UNKNOWN_STORE`, `TOO_LONG` (string too long), `TOO_SHORT` (string too short), `VALIDATION_ERROR` (other).

## Routes

### GET `/api/meta`

Stores, categories and users for the switchers and filters. A store is `{ id, name }`; ids are kebab-case slugs such as `mont-kiara` or `subang`. A user is `{ id, name, initials, role }`.

Response: `{ stores, categories, users, currentUser }`. `currentUser` is the user derived from the cookie (or the default Staff user if missing/unknown).

### GET `/api/products`

Query: `store` (`all` or a store id, default `all`), `q`, `category`, `status` (`in_stock` | `low` | `out`), `sort` (`updatedAt` | `sku` | `name` | `category` | `onHand` | `reorderLevel` | `unitCostSen` | `status`), `dir` (`asc` | `desc`), `page`, `pageSize` (25, 50 or 100; default 25). Always paginated. Default is `sort=updatedAt&dir=desc`. The client turns "sort off" into omitting both params.

Response:

```json
{
  "items": [
    {
      "id": "p_001",
      "sku": "KL-1042",
      "name": "Arabica Beans 1kg",
      "category": "Coffee",
      "supplier": "Highland Roasters",
      "unitCostSen": 6800,
      "onHand": 18,
      "reorderLevel": 20,
      "status": "low",
      "updatedAt": "2026-10-15T08:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 247,
  "summary": { "totalProducts": 250, "stockValueSen": 18452300, "lowStock": 31, "outOfStock": 9 }
}
```

- A product belongs to a store scope only if it is carried (has stock) there. `totalProducts` counts those products. With `store=all` that is every product with stock in at least one store.
- With `store=all`, `onHand` and `reorderLevel` are sums across the stores that carry it, and `status` is calculated from those sums.
- `summary` follows the store scope and ignores search, category, status and paging (see `docs/DECISIONS.md`). `stockValueSen` is the sum of `onHand` times `unitCostSen` over the scope.
- `updatedAt` is the time of the latest movement in the scope (or the product creation time when there is none).
- Sorting by `status`: `dir=desc` gives Out, Low, In stock (most urgent first), `asc` reverses it. Ties are broken by SKU.
- Search is case-insensitive on name and SKU.

### GET `/api/products/:id`

Query: `store`. Returns product details (including `supplier`, `stockValueSen` and `lastMovementAt` for the scope), totals for the scope, and `stockByStore`: one entry per store that carries the product, with `storeId`, `onHand`, `reorderLevel`, `status`, `lastMovementAt`. Unknown product returns 404 `PRODUCT_NOT_FOUND`.

### GET `/api/products/:id/movements`

Query: `store`, `type` (`receive` | `sell` | `write_off` | `transfer_out` | `transfer_in` | `import`), `period` (`7d` | `30d` | `90d`, default `30d`), `page`, `pageSize` (25, 50 or 100; default 25; invalid pageSize is 422 `VALIDATION_ERROR`). Always paginated. Newest first. The response also has `total` (the count shown on the tab). Unknown product returns 404 `PRODUCT_NOT_FOUND`.

Movement:

```json
{
  "id": "m_123",
  "productId": "p_001",
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

Query: `store`, `days` (`7`, `30` or `90`; default 30; anything else is 422 `VALIDATION_ERROR`). Daily end-of-day stock rebuilt from movements, going backwards from the current stock. Only real points are returned (a brand new product returns one point). Unknown product returns 404 `PRODUCT_NOT_FOUND`.

Response: `{ "points": [ { "date": "2026-10-14", "onHand": 18 } ], "reorderLevel": 40, "days": 30 }`. `reorderLevel` is the sum of the reorder levels of the stores in the scope (the dashed line).

### POST `/api/products/:id/adjustments`

Headers: `Idempotency-Key: <uuid>` (required). Role: Receive and Sell for everyone, Write-off and Transfer for Manager only. A store must carry the product, else 422 `NOT_STOCKED_AT_STORE`.

Body (discriminated union on `type`):

```json
{ "type": "receive",   "storeId": "mont-kiara", "quantity": 10 }
{ "type": "sell",      "storeId": "mont-kiara", "quantity": 2 }
{ "type": "write_off", "storeId": "mont-kiara", "quantity": 1, "note": "Expired" }
{ "type": "transfer",  "fromStoreId": "mont-kiara", "toStoreId": "subang", "quantity": 5, "note": "Rebalancing" }
```

Rules (server enforces all of them):

- `quantity`: whole number, greater than 0.
- Sell, write-off and transfer cannot take the source below 0, else 409 `INSUFFICIENT_STOCK` with a message like `Mont Kiara only has 18 on hand. Enter 18 or less.`
- `note`: required for write-off (trimmed, 3 to 200 characters); optional for other types (up to 200 characters).
- Both transfer movements carry the same `note`.
- Transfer: `fromStoreId` must differ from `toStoreId`, else 422 `VALIDATION_ERROR` with `SAME_STORE`.
- Transfer creates two movements with the same `transferId`, in one transaction.

Response 201:

```json
{ "movements": [ ... ], "stock": [ { "storeId": "mont-kiara", "onHand": 13 }, { "storeId": "subang", "onHand": 25 } ] }
```

A replay of the same key and payload returns the same body and status, plus `Idempotent-Replay: true`.

### POST `/api/imports/validate`

Manager only. Stateless: the request sends the file and the mapping, and the server parses and validates everything.

Body: `multipart/form-data` with:
- `file`: the CSV file (at most 5 MB, else 413 `FILE_TOO_LARGE`; unreadable, empty or no header, else 422 `INVALID_FILE`; max 2000 data rows, else 422 `IMPORT_TOO_LARGE`).
- `storeId`: target store ID (unknown store returns 404 `STORE_NOT_FOUND`).
- `mapping`: JSON text such as `{ "sku": "Item code", "name": "Description", "category": "Group", "quantity": "Qty", "unitCost": "Cost (RM)" }` (all required fields must be mapped, no column reused; bad mapping returns 422 `VALIDATION_ERROR`).

Response 200: every row, valid or not, carries `values` (raw mapped strings) so the UI can highlight bad cells without repeating the mapping:

```json
{
  "summary": { "total": 60, "valid": 53, "invalid": 7, "willCreate": 12, "willUpdate": 41 },
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
      "errors": [
        { "code": "INVALID_QUANTITY", "field": "quantity", "message": "Quantity can't be negative" }
      ]
    }
  ]
}
```

Nothing is saved by this route.

### POST `/api/imports/commit`

Manager only. `Idempotency-Key` required (missing key returns 400 `IDEMPOTENCY_KEY_REQUIRED`).
Same multipart body as validate (the file is sent again). The server validates again, applies all valid rows in ONE transaction, skips invalid ones, writes `import` movements when quantity delta is not 0 (with balanceAfter = quantity and reason = fileName), and persists idempotency. Replaying the same key and request returns 200 with header `Idempotent-Replay: true`. Reusing key with a different payload returns 422 `IDEMPOTENCY_KEY_REUSED`.

Response 200:

```json
{
  "created": 12,
  "updated": 40,
  "unchanged": 1,
  "skipped": 7,
  "skippedRows": [
    {
      "rowNumber": 9,
      "errors": [
        { "code": "INVALID_QUANTITY", "field": "quantity", "message": "Quantity can't be negative" }
      ]
    }
  ]
}
```

### POST `/api/test/reset`

Only available in dev or when `E2E=1`. Restores the seed data.
