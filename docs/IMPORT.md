# CSV import

Manager only. The page is hidden and redirected for Staff, and `validate` and `commit` return 403 for Staff. UI behavior of each step is in `docs/UI-NOTES.md`.

## Flow

1. **Upload**: choose a store, choose a `.csv` (drag and drop or click). Non-CSV files and files over 5 MB are rejected in the browser before upload, and again by the server. The browser reads only the header and a few rows, to build the mapping step and the error download.
2. **Map columns**: each file column gets a Stockroom field or "Don't import".
3. **Review**: the file and the mapping are sent to the server, which parses and validates every row. The user sees valid and invalid rows with reasons.
4. **Done**: summary header block ("Import complete" or "Nothing was imported"), 4 StatCards (created, updated, unchanged, skipped), warning banner with "Download skipped rows (CSV)" if any skipped, "View products in <Store>" and "Import another file". Stepper marks all 4 steps finished with checks.

Nothing is saved before the user confirms on Review.

## Fields

Required (Continue is disabled until all 5 are mapped): `sku`, `name`, `category`, `quantity`, `unitCost`.
There is no reorder level field in the design, so imports never change reorder levels.

## Column mapping

- Auto-match by normalised header name, case-insensitive (lowercase, trim, remove spaces, dashes, underscores and currency text in brackets). Small alias list per field, for example `sku` = `sku`, `item code`, `code`; `quantity` = `quantity`, `qty`, `on hand`; `unitCost` = `unit cost`, `cost`, `cost (rm)`.
- Each mapped column shows `Matched` when it came from auto-match and `Set by you` once the user changed it.
- Unmatched columns start as "Don't import" (shown as "Skipped") and can be set by hand.
- One Stockroom field can be used by only one column.
- If a required field cannot be mapped, the user must fix the file or pick another file.

## How rows are processed

- An existing SKU updates the product (name, category, unit cost) and sets the quantity at the chosen store. If the product is not carried at that store yet, it becomes carried there (reorder level 0). If only name, category or cost changed, the row is `updated` and no movement is written.
- A new SKU creates the product (with supplier `null`), carried only at the chosen store with the file's quantity (other stores are not touched) and reorder level 0.
- Products are identified by SKU only, never by name. A new SKU with an existing name creates a new product.
- SKUs are trimmed and uppercased before comparing.
- `quantity` is the new on-hand count at the chosen store, not a change. The server computes `delta = new - current` and writes one movement of type `import` (note: the file name, cut to 200 chars) only when delta is not 0.
- `unchanged` means nothing changed: name, category, unit cost and quantity are all identical.
- Unit cost is text such as `68.00`. It is converted to sen with string parsing, never with floats. Accepted: digits with up to 2 decimals, optional leading `RM`.
- Row numbers: the first data row is row 1 (the header is not counted).

## Row errors (each row can have several, the UI shows the first)

Exact messages are in `docs/SCREENS.md`.

| Code                    | Meaning                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `MISSING_REQUIRED`      | A required field is empty (SKU, name, category, quantity or unit cost)  |
| `INVALID_QUANTITY`      | Not a whole number, or negative                                         |
| `INVALID_UNIT_COST`     | Not a valid amount, negative, or more than 2 decimals                   |
| `INVALID_SKU`           | Too long, or has characters outside the allowed set                     |
| `UNKNOWN_CATEGORY`      | Category is not one of the existing categories (case-insensitive match) |
| `DUPLICATE_SKU_IN_FILE` | The SKU already appeared on an earlier row                              |
| `NAME_TOO_LONG`         | Name is longer than the limit                                           |

Duplicate SKU rule: the first row with a SKU is judged on its own, and every later row with the same SKU is invalid with the message "Same SKU as row N" (N is the first row's number), as the design shows.

## Review step

- Summary: total, valid, invalid, will create, will update.
- Table of rows with status (icon and text, not colour only) and reasons. Every row, valid or not, carries `values` (the raw mapped strings) so the UI can highlight bad cells without repeating the mapping.
- Button: import N valid rows. Disabled when there are 0 valid rows.
- Button: download broken rows as CSV. It contains the original columns (from the browser's copy of the rows) plus an `error` column with the readable reason from the server, joined by row number, so the user can fix it and upload it again.

## Limits

| Limit | Value | Error code / Rule |
| --- | --- | --- |
| Max file size | 5 MB | `FILE_TOO_LARGE` (413) |
| Max rows | 2000 data rows | `IMPORT_TOO_LARGE` (422) |
| Max SKU length | 32 characters | `INVALID_SKU` |
| Max Name length | 120 characters | `NAME_TOO_LONG` |

## Commit

- Sends the same file and mapping again. The server validates again, because the data could have changed since the review.
- Applies all valid rows in one transaction. Rows that became invalid are skipped and reported.
- Requires `Idempotency-Key`, so a double click does not import twice. The key is created once with `crypto.randomUUID()` when the person lands on Review with a valid result, reused for retries and double clicks, and replaced when the file, the store or the mapping changes.
- On success: invalidates `queryKeys.products.all` so list, detail, movements and charts refetch immediately.
- On error: stays on Review with `QueryErrorState` (hasData true, inline banner) with "Try again" (same key). Mapping field errors navigate back to Map with an inline message. 403 errors refresh the page, redirecting Staff. Non-standard platform 413 responses map to the standard file too large message.

## Files in the repo

- `public/stockroom-import-template.csv`: header row only, with the Stockroom field names (for the "Download template (CSV)" link).

## Sample file

`samples/import-sample.csv`: at least 50 rows, including broken rows covering at least five error kinds above (missing SKU, negative quantity, decimal quantity, invalid cost, missing cost, unknown category, duplicate SKU), plus a few existing SKUs and a few new ones. Column headers should differ a little from the Stockroom names (for example `Item code`, `Description`, `Group`, `Qty`, `Cost (RM)`) so auto-mapping can be demonstrated.
