# CSV import

Manager only. The nav link is hidden for Staff, the page redirects them to `/products?notice=managers-only`, and `validate` and `commit` return 403 for Staff. UI behavior of each step is in `docs/UI-NOTES.md`. Routes and response shapes are in `docs/API.md`.

Code map: validation rules `src/domain/importValidation.ts`; messages and limits `src/constants/imports.ts`; server `src/server/services/imports/` (`readImportForm`, `validateImport`, `commitImport`); routes `src/app/api/imports/{validate,commit}`; browser helpers `src/helpers/{csvParse,importMapping,importDownload}.ts`; wizard `src/components/import/` and `src/hooks/useImportWizard.ts`.

## Flow

1. **Upload**: choose a store, choose a `.csv` (drag and drop or click). Non-CSV files and files over 5 MB are rejected in the browser before upload, and again by the server. The browser reads only the header and a few rows, to build the mapping step and the error download.
2. **Map columns**: each file column gets a Stockroom field or "Don't import".
3. **Review**: the file and the mapping are sent to the server, which parses and validates every row. The user sees valid and invalid rows with reasons.
4. **Done** (not designed, see DECISIONS.md): summary and links.

Nothing is saved before the user confirms on Review.

## Fields

Required (Continue is disabled until all 5 are mapped): `sku`, `name`, `category`, `quantity`, `unitCost`.
There is no reorder level field in the design, so imports never change reorder levels.

## Column mapping

- Auto-match by normalised header name, case-insensitive. The alias list is in `IMPORT_FIELD_ALIASES`: `sku` = sku, item code, code, item sku; `name` = name, description, product, product name, item name; `category` = category, group, type; `quantity` = quantity, qty, on hand, stock; `unitCost` = unit cost, cost, cost (rm), price.
- Each mapped column shows `Matched` when it came from auto-match and `Set by you` once the user changed it.
- Unmatched columns start as "Don't import" (shown as "Skipped") and can be set by hand.
- One Stockroom field can be used by only one column.
- If a required field cannot be mapped, the user must fix the file or pick another file.

## How rows are processed

- An existing SKU updates the product (name, category, unit cost) and sets the quantity at the chosen store. If the product is not carried at that store yet, it becomes carried there (reorder level 0).
- A new SKU creates the product, carried only at the chosen store with the file's quantity (other stores are not touched) and reorder level 0.
- Products are identified by SKU only, never by name. A new SKU with an existing name creates a new product.
- SKUs are trimmed and uppercased before comparing.
<<<<<<< Updated upstream
- `quantity` is the new on-hand count at the chosen store, not a change. The server computes `delta = new - current` and writes one movement of type `import` (note: the file name) when delta is not 0. Delta 0 counts as `unchanged` and writes no movement.
=======
- `quantity` is the new on-hand count at the chosen store, not a change. The server computes `delta = new - current` and writes one movement of type `import` (note: the file name, cut to 200 chars; `balanceAfter` is the new quantity) only when delta is not 0.
- `unchanged` means nothing changed: name, category, unit cost and quantity are all identical.
>>>>>>> Stashed changes
- Unit cost is text such as `68.00`. It is converted to sen with string parsing, never with floats. Accepted: digits with up to 2 decimals, optional leading `RM`.
- Row numbers: the first data row is row 1 (the header is not counted).

## Row errors (each row can have several, the UI shows the first)

Exact messages are in `docs/SCREENS.md`.

| Code                    | Meaning                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `MISSING_REQUIRED`      | A required field is empty (SKU, name, category, quantity or unit cost)  |
| `INVALID_QUANTITY`      | Not a whole number, or negative                                         |
| `INVALID_UNIT_COST`     | Not a valid amount, negative, or more than 2 decimals                   |
| `INVALID_SKU`           | Longer than 32 characters, or has characters other than letters, digits, dot and hyphen |
| `UNKNOWN_CATEGORY`      | Category is not one of the existing categories (case-insensitive match) |
| `DUPLICATE_SKU_IN_FILE` | The SKU already appeared on an earlier row                              |
| `NAME_TOO_LONG`         | Name is longer than the limit                                           |

Duplicate SKU rule: the first row with a SKU is judged on its own, and every later row with the same SKU is invalid with the message "Same SKU as row N" (N is the first row's number), as the design shows.

## Review step

- Summary: total, valid, invalid, will create, will update.
- Table of rows with status (icon and text, not colour only) and reasons.
- Button: import N valid rows. Disabled when there are 0 valid rows.
- Button: download broken rows as CSV. It contains the original columns (from the browser's copy of the rows) plus an `error` column with the readable reason from the server, joined by row number, so the user can fix it and upload it again.

## Commit

- Sends the same file and mapping again. The server validates again, because the data could have changed since the review.
- Applies all valid rows in one transaction. Rows that became invalid are skipped and reported.
- Requires `Idempotency-Key`, so a double click does not import twice.
- Limits: 2000 rows per file (`IMPORT_TOO_LARGE`).

## Files in the repo

- `public/stockroom-import-template.csv`: header row only (`SKU,Name,Category,Quantity,Unit cost`), for the "Download template (CSV)" link.
- `samples/import-sample.csv`: the sample file (below). `scripts/generate-import-sample.ts` builds it deterministically from `data/seed.json`; run `npm run sample:import` after the seed changes.

## Sample file

`samples/import-sample.csv`: 63 data rows. Against the seed and store `mont-kiara` the server reports 55 valid and 8 invalid rows, 15 to create and 40 to update (pinned by a test in `importsService.test.ts`). The broken rows cover several error kinds (for example missing SKU, negative quantity, decimal quantity, invalid or missing cost, unknown category, duplicate SKU). Column headers differ from the Stockroom names (`Item code`, `Description`, `Group`, `Qty`, `Cost (RM)`, plus `Barcode` and `Supplier`, which are skipped) so auto-mapping can be demonstrated.
