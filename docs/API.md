# API

All routes live under `/api`, built with Next.js Route Handlers. Every route is wrapped by `withApi` (see ARCHITECTURE.md): about 500 ms delay, `?fail=1` forces a 500, role comes from the cookie.

## Session

- Cookie `stockroom_role` = `manager` or `staff`.
- Missing or invalid cookie is treated as `staff` (least privilege).
- `POST /api/session` with `{ "role": "manager" | "staff" }` sets the cookie (used by the user switcher).

## Error format (everywhere)

```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "Cannot sell 12. Only 5 on hand at Bangsar.",
  "fieldErrors": [
    { "field": "quantity", "code": "TOO_MANY", "message": "Only 5 on hand." }
  ]
}
```

- `error`: stable code, the frontend branches on this only.
- `message`: human readable, safe to show.
- `fieldErrors`: always present, empty array when not relevant.

## Codes and status codes

| Status | `error` | When |
|---|---|---|
| 400 | `INVALID_JSON` | Body is not parseable JSON |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | Missing `Idempotency-Key` on a route that needs it |
| 403 | `FORBIDDEN` | Role cannot do this action (Staff write-off, transfer, import) |
| 404 | `PRODUCT_NOT_FOUND` | Unknown product id |
| 404 | `STORE_NOT_FOUND` | Unknown store id |
| 409 | `INSUFFICIENT_STOCK` | Sell, write-off or transfer would take a store below 0 |
| 422 | `VALIDATION_ERROR` | Body or query failed validation (see `fieldErrors`), including same-store transfer and missing write-off reason |
| 422 | `IDEMPOTENCY_KEY_REUSED` | Same key, different payload |
| 422 | `IMPORT_TOO_LARGE` | More rows than the limit (default 2000) |
| 500 | `INTERNAL_ERROR` | Unexpected error, or forced with `?fail=1` |

Field error codes used inside `fieldErrors`: `REQUIRED`, `NOT_A_WHOLE_NUMBER`, `MUST_BE_POSITIVE`, `TOO_MANY`, `SAME_STORE`, `UNKNOWN_STORE`, `TOO_LONG`, `TOO_SHORT`.

## Routes

### GET `/api/meta`
Stores and categories for switchers and filters.

### GET `/api/products`
Query: `store` (`all` or a store id, default `all`), `q`, `category`, `status` (`in_stock` | `low` | `out`), `sort` (`sku` | `name` | `category` | `onHand` | `reorderLevel` | `status`), `dir` (`asc` | `desc`), `page`, `pageSize`.

Response:
```json
{
  "items": [
    { "id": "p_001", "sku": "KL-1042", "name": "Arabica Beans 1kg", "category": "Coffee",
      "unitCostSen": 6800, "onHand": 18, "reorderLevel": 20, "status": "low" }
  ],
  "page": 1, "pageSize": 10, "total": 247,
  "summary": { "totalProducts": 250, "lowStock": 31, "outOfStock": 9 }
}
```

- With `store=all`, `onHand` and `reorderLevel` are sums across stores, and `status` is calculated from those sums.
- `summary` follows the store scope and ignores search, category, status and paging (reason in `docs/DECISIONS.md`). `[verify the card list against Figma]`
- Status sort order is Out, Low, In stock (ascending). Ties are broken by SKU.
- Search is case-insensitive on name and SKU.

### GET `/api/products/:id`
Query: `store`. Returns product details, totals for the scope, and `stockByStore` (all six stores with `onHand`, `reorderLevel`, `status`).

### GET `/api/products/:id/movements`
Query: `store`, `type` (`receive` | `sell` | `write_off` | `transfer_out` | `transfer_in` | `import`), `from`, `to`, `page`, `pageSize`. Newest first.

Movement:
```json
{ "id": "m_123", "productId": "p_001", "storeId": "s_bangsar",
  "type": "transfer_out", "quantity": -5, "balanceAfter": 13,
  "reason": null, "transferId": "t_77", "createdAt": "2026-10-15T08:30:00Z", "createdBy": "manager" }
```

### GET `/api/products/:id/stock-history`
Query: `store`, `days` (default 30). Daily end-of-day stock rebuilt from movements, going backwards from the current stock. Only real points are returned (a brand new product returns one point).

### POST `/api/products/:id/adjustments`
Headers: `Idempotency-Key: <uuid>` (required). Role: Receive and Sell for everyone, Write-off and Transfer for Manager only.

Body (discriminated union on `type`):
```json
{ "type": "receive",   "storeId": "s_bangsar", "quantity": 10 }
{ "type": "sell",      "storeId": "s_bangsar", "quantity": 2 }
{ "type": "write_off", "storeId": "s_bangsar", "quantity": 1, "reason": "Expired" }
{ "type": "transfer",  "fromStoreId": "s_bangsar", "toStoreId": "s_klcc", "quantity": 5 }
```

Rules (server enforces all of them):
- `quantity`: whole number, greater than 0.
- Sell, write-off and transfer cannot take the source below 0, else 409 `INSUFFICIENT_STOCK`.
- Write-off requires `reason` (trimmed, 3 to 200 characters).
- Transfer: `fromStoreId` must differ from `toStoreId`, else 422 `VALIDATION_ERROR` with `SAME_STORE`.
- Transfer creates two movements with the same `transferId`, in one transaction.

Response 201:
```json
{ "movements": [ ... ], "stock": [ { "storeId": "s_bangsar", "onHand": 13 }, { "storeId": "s_klcc", "onHand": 25 } ] }
```
A replay of the same key and payload returns the same body and status, plus `Idempotent-Replay: true`.

### POST `/api/imports/validate`
Manager only. Stateless: the browser parses the file and sends rows and mapping, the server validates everything again.

Body: `{ "storeId": "...", "mapping": { "sku": "Item code", ... }, "rows": [ { "Item code": "KL-1", ... } ] }`

Response 200:
```json
{ "summary": { "total": 60, "valid": 53, "invalid": 7, "willCreate": 12, "willUpdate": 41 },
  "rows": [ { "rowNumber": 2, "status": "valid", "action": "update", "data": { ... }, "errors": [] },
            { "rowNumber": 9, "status": "invalid", "errors": [ { "code": "INVALID_QUANTITY", "field": "quantity", "message": "..." } ] } ] }
```
Nothing is saved by this route.

### POST `/api/imports/commit`
Manager only. `Idempotency-Key` required. Same body as validate. The server validates again, applies the valid rows in one transaction, skips invalid ones and returns:
```json
{ "created": 12, "updated": 40, "unchanged": 1, "skipped": 7, "skippedRows": [ { "rowNumber": 9, "errors": [ ... ] } ] }
```

### POST `/api/test/reset`
Only available in dev or when `E2E=1`. Restores the seed data.
