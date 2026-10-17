# Screens: exact copy, names and formats

Source: the Figma screenshots (Screens and Components pages). This file holds strings, names, formats and sample numbers, so tests and UI use the same wording. Behavior is in `docs/UI-NOTES.md`. "Own wording" marks text the design does not show, which we wrote ourselves.

## Names

- **Stores** (id slug, name): `mont-kiara` Mont Kiara, `subang` Subang, `damansara` Damansara, `cheras` Cheras, `puchong` Puchong, `shah-alam` Shah Alam. Switcher label: "All stores (6)".
- **Categories** (6): Coffee, Dairy & alt., Packaging, Syrups, Bakery, Tea. "Snacks" does not exist (used as the invalid import example).
- **Users** (id, name, initials, role): `aina-rahman` Aina Rahman AR Manager; `faiz-hakim` Faiz Hakim FH Staff; `mei-ling` Mei Ling ML Staff (role is not shown in the design, assumed Staff).
- **Suppliers** (samples): Highland Roasters, Kopi Lane roastery, Green Field Oats, Valley Dairy, PackRight, Sweet Bar Co., Golden Crumb Bakery.
- **Sidebar:** logo "KL", "Stockroom", "Kopi Lane". Section "INVENTORY": Products, Import, Suppliers (tag "Soon", disabled), Reports (tag "Soon", disabled). Import is visible to Managers only. User card: initials, name, role, link "Switch".
- **Tabs:** Overview, Movements (count badge).
- **Adjustment types (dialog):** Receive, Sell, Write-off, Transfer.
- **Movement types (history):** `receive` Received, `sell` Sold, `write_off` Write-off, `transfer_out` Transfer out, `transfer_in` Transfer in, `import` Import. Pill colors: Received blue (arrow-down), Sold grey (arrow-up), Write-off red (x), Transfer in and out purple (transfer arrows), Import green (upload).

## Formats

- **Currency:** table cells and Unit cost column: `68.00`. Cards, details and sentences: `RM 182,430.50`, `RM 68.00 per unit`. Thousands comma, two decimals, SKUs and money in the mono font.
- **Counts:** `248 results`, `0 results`, `128 movements`, range `1–25 of 248` and `26–50 of 248` (en dash, mono).
- **Dates and times** (`formatWhen(date, now)`): under 12 hours ago `2h ago`; same day `Today, 09:10`; the day before `Yesterday`; older `12 Oct`. Movement history uses `14 Oct, 10:58` (24-hour, no year). Chart axis: `14 Sep`, `Today`.
- **Changes:** `−12` and `+12` with a true minus sign (U+2212). Negative red, positive green.
- **Status text:** badge `In stock`, `Low`, `Out of stock`. Card `Low stock`. Chip `Status: Low`. Icons: In stock circle-check, Low warning triangle, Out of stock circle-exclamation.
- **Page sizes:** 25 (default), 50, 100.
- **Rows:** header row height 40, body rows 52.
- **Icons:** the Figma SVGs in `src/components/icons/`, 16 px, 1.2 stroke on the 16 grid, one color through `currentColor`. Never emoji or font glyphs.

## Products list

- **Title and subtitle:** "Products"; all stores `248 products across 6 stores`; one store `212 products at Mont Kiara`. (The design also shows `· synced 2 min ago`; optional, Phase 7.)
- **Header button:** "Import CSV" (Managers only). The design also has an "Export" button here; we do not build it (selected-rows export is the one the brief asks for).
- **Cards** (title / value / subtitle): Products / `248` / "Across 6 categories" (one store: "Active at this store"); Stock value / `RM 182,430.50` / "At unit cost, all stores" (one store: "At unit cost"); Low stock / `17` in amber / "At or below reorder level"; Out of stock / `6` in red / "Needs a reorder". Loading: value is the dash placeholder (U+2014), subtitles stay.
- **Toolbar:** search placeholder "Search name or SKU"; dropdowns "All categories", "All statuses"; right side `248 results`. Status options: All statuses, In stock, Low, Out of stock (own wording).
- **Columns, in order:** checkbox (select all), SKU, Product (name, with the supplier on a second line), Category, On hand, Reorder at, Status, Unit cost, Updated, `···`. Sortable: SKU, Product, Category, On hand, Reorder at, Unit cost, Updated. Status has no sort icon in the design; we still sort it (see DECISIONS).
- **Selection toolbar** (replaces the toolbar): indeterminate checkbox and `3 selected`, "Export selected", "Clear selection".
- **Chips:** `Store: Mont Kiara`, `Search: matcha`, `Category: Coffee`, `Status: Low`, each with an x, then the text button "Clear all".
- **Empty, no results:** icon search; "No products match these filters"; "Try a different search or remove a filter."; button "Clear filters".
- **Empty, no catalogue:** icon box; "No products yet"; "Import a CSV to get started. You can download a template first."; button "Import CSV" (Managers; for Staff, no button, own wording: "Ask a manager to import products.").
- **Error:** red banner "We couldn't load products" / "The server returned an error (500). Your data hasn't changed." with link "Try again"; below it the centered state icon "!" "Something went wrong" / "We couldn't load this page. Your data is safe." with button "Try again". Both do the same thing: refetch the list.
- **Footer:** "Rows per page" select, range text, previous and next icon buttons (own wording for labels: "Previous page", "Next page").
- **Menu:** `···` has one item: "Adjust stock".

## Product detail

- **Breadcrumb:** "Products > Arabica beans 1 kg". **Title:** product name with the status badge. **Meta line:** SKU chip, then `Coffee · Highland Roasters · RM 68.00 per unit`. Buttons: "Adjust stock" (and a `···` icon button, no items defined, not built).
- **Tabs:** "Overview", "Movements" with the count of movements in the scope.
- **Chart card:** "On hand, last 30 days" (7d and 90d change the number); subtitle "All stores combined · reorder level is the sum of store levels" (one store: "Mont Kiara"); segmented "7d", "30d", "90d"; legend "On hand" and `Reorder level (30)`; tooltip `9 Oct` / `22 on hand`.
- **Details card:** On hand (all stores) `84`; Reorder level `30`; Unit cost `RM 68.00`; Stock value `RM 5,712.00`; Supplier; Last movement `Today, 10:42`. With one store the first label is "On hand".
- **Stock by store:** title; amber text `2 of 6 stores need attention` (stores that are Low or Out of stock, out of the stores that carry the product); columns Store, On hand, Reorder at, Status, Last movement, action "Adjust".
- **Movements columns:** Date & time (sorted newest first), Type (pill), Store, Change, Balance, By (initials and name), Note. Filters: "All types", "All stores", "Last 30 days". The Store cell of a transfer reads `Mont Kiara → Subang` on the out row and `Subang ← Mont Kiara` on the in row.
- **Movements empty:** no movements yet (own wording): "No movements yet" / "Stock changes for this product will show up here." with button "Receive stock". With filters: "No movements match these filters" / "Try a different type, store or period." with "Clear filters" (own wording).

## Adjust stock dialog

- **Header:** "Adjust stock", close button, SKU chip and product name.
- **Fields:** Type (segmented). Sell: Store, Quantity. Receive: Store, Quantity, Note. Write-off: Store, Quantity, Reason (own wording, required, same field as Note). Transfer: From, To (with a swap button between them), Quantity, Note. Options read `Subang · 4 on hand`. Only stores that carry the product are listed. Note helper "Optional · max 200 characters". Quantity helper "Whole units only." (the design shows the Note field on Transfer only; Receive having a note is our choice because the history shows "PO-7781" on received rows).
- **Preview:** title "After this change"; rows `Mont Kiara 18 → 6`, `Subang 4 → 2 ⚠ Low` (status text and icon, not the emoji); invalid quantity shows `18 → –`.
- **Footer:** `Signed in as Aina Rahman (Manager)`, "Cancel", and the submit button. Submit labels: `Receive 20 units`, `Sell 2 units`, `Write off 1 unit`, `Transfer 24 units` ("unit" when 1). While the quantity is empty or invalid it reads `Receive`, `Sell`, `Write off`, `Transfer` (own wording) and is disabled. Saving: "Saving...".
- **Errors:** quantity too high `Mont Kiara only has 18 on hand. Enter 18 or less.`; not a whole number or below 1 `Enter a whole number above 0.` (own wording); reason `Enter a reason (at least 3 characters).` (own wording).
- **Staff lock:** the Write-off and Transfer options show a lock icon and the tooltip "Only managers can write off or transfer stock" (the Components page says "Only managers can write off stock."; we use one text for both because both are locked).
- **Toasts** (max one visible, a new one replaces the old, bottom right, auto-dismiss after 5 s, own choice): Transfer `Transfer saved` / `12 units moved from Mont Kiara to Subang.` Others (own wording): `Stock received` / `+20 units at Mont Kiara.`, `Sale recorded` / `−2 units at Subang.`, `Write-off saved` / `1 unit written off at Mont Kiara.`. Error toast: `Couldn't save` / the server message.

## Import

- **Header:** "Import products"; "Add new products or update existing ones from a CSV. You can check every row before anything is saved." Stepper: 1 Upload, 2 Map columns, 3 Review, 4 Done.
- **Upload:** dropzone "Drop a CSV file here", link "or choose a file", "CSV only · up to 5 MB · 2,000 rows max". Card "Before you upload": "First row is the column header." / "Required: SKU, name, category, quantity, unit cost." / "Quantity is the new on-hand count, not a change." / "Unit cost in RM with a dot, e.g. 12.50." / "Category must already exist in Stockroom." / "A SKU that exists is updated. A new SKU is created." Link "Download template (CSV)". Field "Import into store" with helper "Quantities in the file set the on-hand count at this store only. Other stores are not touched." Footer: "Cancel", hint "Choose a file to continue", "Continue". Rejection messages (own wording): "Only CSV files are supported." and "This file is over 5 MB."
- **Map columns:** file card `kopi-lane-stock-oct.csv` / `120 rows · 7 columns · 18 KB · into Mont Kiara` / "Replace file". Amber banner `2 columns won't be imported` / `Barcode and Supplier aren't fields in Stockroom, so they'll be skipped. That's fine.` Table headers: "Column in your file", "Sample values", "Maps to", status. Status labels: Matched (green, check), Set by you (blue, info), Skipped (grey, dash). Success line "All 5 required fields are mapped." Buttons: "Back", "Continue to review". Field names in the "Maps to" menu: SKU, Name, Category, Quantity, Unit cost, "Don't import".
- **Review:** badges `114 ready` and `6 with errors`; tabs "All rows 120", "Errors 6", "Ready 114"; columns Row, SKU, Name, Category, Qty, Unit cost, Problem; bad cells in red chips. Footer: "Back", hint "Rows with errors are skipped", "Download errors (CSV)", `Import 114 rows into Mont Kiara`.
- **Problem messages** (first error of the row is shown; the download has all): `Quantity can't be negative`, `Quantity must be a whole number` (own wording), `Unit cost isn't a number`, `Unit cost is missing`, `SKU is missing`, `Same SKU as row 3`, `Category "Snacks" doesn't exist`, plus own wording for the rest: `Name is missing`, `Quantity is missing`, `Category is missing`, `Name is too long`.
- **Row numbers:** the first data row is row 1 (the header is not counted).
- **Done step:** not designed (see DECISIONS).
