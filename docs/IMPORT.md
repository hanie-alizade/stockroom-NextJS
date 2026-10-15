# CSV import

Manager only. Page hidden for Staff, `validate` and `commit` return 403 for Staff.

## Flow

1. **Upload**: choose a store, choose a `.csv`. The browser parses it (header row required) and keeps the rows in memory.
2. **Map columns**: each file column gets a Stockroom field or "Don't import".
3. **Review**: the server validates every row. The user sees valid and invalid rows with reasons.
4. **Done** (not designed, see DECISIONS.md): summary and links.

Nothing is saved before the user confirms on Review.

## Fields

Required (Continue is disabled until all are mapped): `sku`, `name`, `category`, `quantity`, `unitCost`. `[verify the list against the Figma mapping screen]`
Optional: `reorderLevel` `[verify in Figma]`.

## Column mapping

- Auto-match by normalised header name (lowercase, trim, remove spaces, dashes, underscores and currency text in brackets). Small alias list per field, for example `sku` = `sku`, `item code`, `code`; `quantity` = `quantity`, `qty`, `on hand`; `unitCost` = `unit cost`, `cost`, `cost (rm)`.
- Each mapped column shows `Matched` when it came from auto-match and `Set by you` once the user changed it.
- Unmatched columns start as "Don't import" and can be set by hand.
- One Stockroom field can be used by only one column.
- If a required field cannot be mapped, the user must fix the file or pick another file.

## How rows are processed

- An existing SKU updates the product (name, category, unit cost, and the quantity at the chosen store). A new SKU creates the product, with stock 0 in the other stores.
- Products are identified by SKU only, never by name. A new SKU with an existing name creates a new product.
- SKUs are trimmed and uppercased before comparing.
- `quantity` is the new on-hand count at the chosen store, not a change. The server computes `delta = new - current` and writes one movement of type `import` when delta is not 0. Delta 0 counts as `unchanged` and writes no movement.
- Unit cost is text such as `68.00`. It is converted to sen with string parsing, never with floats. Accepted: digits with up to 2 decimals, optional leading `RM`.

## Row errors (each row can have several)

| Code | Meaning |
|---|---|
| `MISSING_REQUIRED` | A required field is empty |
| `INVALID_QUANTITY` | Not a whole number, or negative |
| `INVALID_UNIT_COST` | Not a valid amount, negative, or more than 2 decimals |
| `INVALID_SKU` | Empty after trimming, too long, or has characters outside the allowed set |
| `UNKNOWN_CATEGORY` | Category is not one of the existing categories (case-insensitive match) |
| `DUPLICATE_SKU_IN_FILE` | The SKU appears on more than one row; message lists the row numbers |
| `NAME_TOO_LONG` | Name is longer than the limit |
| `INVALID_REORDER_LEVEL` | If mapped: not a whole number, or negative |

Duplicate SKU decision: every row with a repeated SKU is marked invalid, because there is no safe way to know which quantity is right. The user fixes the file and uploads again. `[verify this matches the Figma review screen]`

## Review step

- Summary: total, valid, invalid, will create, will update.
- Table of rows with status (icon and text, not colour only) and reasons.
- Button: import N valid rows. Disabled when there are 0 valid rows.
- Button: download broken rows as CSV. It contains the original columns plus an `error` column with the readable reason, so the user can fix it and upload it again.

## Commit

- Sends the same payload again. The server validates again, because the data could have changed since the review.
- Applies all valid rows in one transaction. Rows that became invalid are skipped and reported.
- Requires `Idempotency-Key`, so a double click does not import twice.
- Limits: 2000 rows per file (`IMPORT_TOO_LARGE`).

## Sample file

`samples/import-sample.csv`: at least 50 rows, including broken rows covering at least five error kinds above (missing SKU, negative quantity, decimal quantity, invalid cost, unknown category, duplicate SKU), plus a few existing SKUs and a few new ones. Column headers should differ a little from the Stockroom names (for example `Item code`, `Description`, `Group`, `Qty`, `Cost (RM)`) so auto-mapping can be demonstrated.
