# Decisions

Format: what I chose, why, and what I gave up. Section 1 and 2 feed the README answers. Section 3 holds smaller decisions. Section 4 lists known gaps that are decisions still open.

## 1. Answers to the Handoff "Open questions"

**Is a product with reorder level 0 ever Low?**
No. By the Handoff rule, Low means more than 0 and at or below the reorder level, and no number is both above 0 and at or below 0. So stock 0 is Out, and any positive stock is In stock. I think this is right: a reorder level of 0 means "never reorder", so there is nothing to warn about. With "All stores", the sums are used, so a product can still be Low overall if the summed reorder level is above 0.

**Transfer to the same store**
Prevented in two places. The UI leaves the "From" store out of the "To" list. The server also rejects it with 422 `VALIDATION_ERROR` and a `SAME_STORE` field error, because the UI is not enough on its own. If the "From" store changes after "To" was chosen and they now match, "To" is cleared.

**Sorting by Status**
Out, then Low, then In stock (most urgent first) when ascending, reversed when descending. Ties are sorted by SKU so the order is stable between pages. Alphabetical order would put "In stock" before "Low" before "Out", which is meaningless for someone scanning for problems.

**Chart with a single point**
Show it honestly. One point is drawn as a visible dot with a tooltip, and a short caption such as "Only 1 data point so far", rather than a line that implies a trend. No fake history is generated. With zero points, the chart shows a small empty state. A line chart makes sense again from two points.

## 2. Parts that were not designed

**Below 1024px**

- Breakpoints: the sidebar is fixed from 1024px (`lg`); the table is used from 768px (`md`), cards below it.
- 768 to 1023px: sidebar collapses into a top bar (MobileHeader) with a menu button and slide-in sheet; the table scrolls horizontally inside its own container with Checkbox, SKU, and Name columns sticky on the left; first columns of StockByStoreTable (Store) and MovementsTable (Date & time) are also sticky.
- Under 768px (down to 375px): the sidebar is accessed via MobileHeader slide-in sheet; table rows become cards (name, mono SKU, status badge, on hand, reorder level, unit cost); filters collapse into a bottom "Filters" sheet with category, status, sort key and direction toggle (changes apply immediately to URL); selection toolbar and chips wrap; pagination places range text on its own row; touch targets are at least 44px for icon buttons and navigation.
- Product detail below 1024px: header stacks (Adjust stock button full width under 640px), breadcrumb truncates product name, meta line wraps, Overview displays in 1 column (Chart then Details card then Stock by store), Movements filters wrap into a grid (1 column under 640px, 2 columns from 640px) with movements count text below.
- Adjust stock dialog: stays a centered dialog (560px wide, never wider than the viewport minus 32px, never taller than the viewport minus 32px). The body scrolls, the footer stays visible. Under 640px the From and To fields stack, the swap button turns 90 degrees, and the footer buttons stack under the "Signed in as" line.
- Why: a table is still the best format when it fits, cards avoid sideways scrolling on phones, and CSS-first breakpoints avoid layout shifts.

**Import "Done" step**
Built under the stepper with all 4 steps marked finished with checks. Displays a header block with 48px round icon (status-ok green CheckCircle, or amber WarningIcon when nothing was applied or all rows skipped). Title is "Import complete" (or "Nothing was imported" when all rows are skipped), description "<created + updated> products applied to <Store>." (or "Every row was skipped. Download the skipped rows, fix them and try again."). 4 StatCards (grid-cols-2 lg:grid-cols-4): Created, Updated, Unchanged, Skipped (amber tone when > 0) with values taken directly from the commit response. If skipped > 0, an amber banner offers "Download skipped rows (CSV)". Actions provide a primary link "View products in <Store>" and secondary button "Import another file" which resets the wizard to step 1.

**Import validation and platform body limit**
The browser parses the CSV client-side with PapaParse only to populate mapping sample values and build client-side download CSVs preserving original columns. The server re-parses and validates everything, deciding true validity. Cloud platforms (such as Vercel) cap request payloads below 5 MB (around 4.5 MB), which may trigger HTTP 413 before Route Handlers run; `getErrorInfo` maps 413 to the friendly `FILE_TOO_LARGE` message. In `ReviewTable`, the Category column is kept left-aligned (standard for text content), differing from Figma's right-aligned header.

**Product with no movements (Movements tab empty)**
Its own empty state: "No movements yet" with one sentence of explanation, and a "Receive stock" button that opens the dialog. This is different from "no results for these filters" on the same tab, which says that the filters matched nothing and offers "Clear filters".

**Staff opens /import directly**
The link is hidden in the sidebar. If Staff open the URL anyway, the server-side page check redirects them to Products (as the Figma note suggests) with `?notice=managers-only`, and the list shows a small dismissible message "Import is available to managers only", so the person still understands why. The API also returns 403. (An earlier idea was a separate "Managers only" screen; the redirect is less code and follows the design.)

**Saving state inside the dialog**
While the request runs: the submit button shows a spinner and "Saving...", all fields are disabled, and closing is disabled until the request ends so the person cannot lose the result. On error the dialog stays open, keeps the typed values, shows the message at the top (and field messages under fields), and the button becomes "Try again". A retry after an unclear outcome (network error, timeout, 5xx) reuses the same idempotency key for the same payload, so it cannot apply twice. After a clear answer from the server (4xx such as 409 or 422) the next submit gets a new key. On success, a toast appears, the dialog closes and focus returns to the button that opened it.

## 3. Other decisions

- **Summary cards ignore the search and filters.** They only follow the store scope. Otherwise clicking "Low stock" would change the very number you just clicked. The Figma note says the store scopes "cards, table, totals" and does not mention filters.
- **Selection:** "select all" selects the current page only. Selection is cleared when the store, search or filters change (the design says a filter change resets it), and kept when only the page changes. The state keeps the selected rows' data, since rows from other pages are not loaded. Export CSV contains the selected rows as they are shown in the current scope (SKU, name, category, status, on hand, reorder level, unit cost). Money in the export uses the `68.00` form.
- **URL state and navigation history:** only non-default values are written to the URL. Discrete actions (filters, sort, page, page size, store, cards, clear) use `router.push` so Back returns to the previous view; search typing uses `router.push` on the first entry and `router.replace` on subsequent typing after the first entry so Back does not walk through each keystroke. Changing filters, search, sort or page size resets page to 1.
- **Defaults:** sort by Updated, newest first, page size 25 (options 25, 50, 100). Both from the design.
- **Status sort direction:** the design cycles descending, ascending, off for every column. For Status, descending is defined as Out, Low, In stock, so the first click shows the most urgent products and it matches the "Out first" answer above.
- **Notes:** one `note` field on the movement. The design shows an optional Note (max 200) on Transfer and none on Sell. We also allow it on Receive (the history shows "PO-7781" on received rows). For Write-off the same field is required and labelled Reason (3 to 200 characters).
- **Title badge in the detail page:** follows the scope totals (all stores when "All stores" is selected, that store otherwise). The stock-by-store table always shows per-store status.
- **Error with old data on screen:** keep the old data visible and marked as possibly out of date, with a clear error banner and a Retry button. An error is never shown as "0 stock".
- **Users and roles:** the design has three people (Aina Rahman Manager, Faiz Hakim Staff, Mei Ling, whose role is not shown, assumed Staff). The cookie holds a user id and the server derives the role, so a client cannot claim to be a Manager. A missing or unknown cookie falls back to the Staff user Faiz Hakim (least privilege), so a first-time visitor must use "Switch" to become a Manager. This is stated in the README. Movements record who made them (the "By" column).
- **Products carried per store:** the design shows 248 products overall and 212 at Mont Kiara, so a product is carried only at some stores. Adjustments and the dialog lists only use stores that carry the product (else 422 `NOT_STOCKED_AT_STORE`). Import can start carrying a product at the chosen store.
- **Chart data:** rebuilt from movements, going backwards from today's stock. The seed generator makes movements that add up to the current stock so the chart and the numbers agree.
- **Header "Export" button on the list:** built to export all rows of the current scope and filters (store, search, category, status) in the current sort. Batched in chunks of 100 via the existing list API.
- **Status sort:** the design shows no sort icon on the Status header. We still allow sorting by it, because the Handoff notes ask how Status should sort.
- **Wording we wrote ourselves:** toasts for receive, sell and write-off, error toast, empty states of the Movements tab, empty catalogue for Staff, upload rejection messages and a few import messages. Listed in `docs/SCREENS.md` as "own wording".
- **Tooltip text:** the design has two versions ("write off" and "write off or transfer"). We use the second one for both locked types.
- **Sample-data differences in the design** (dates, "Last movement" values, the Aina or Faiz user on the same screen) are example data and are ignored.
- **Dates:** use a fixed time zone (Asia/Kuala_Lumpur) so server and browser agree. Relative time uses a 12-hour threshold, "Yesterday" is by calendar day (not 24 hours), "Just now" covers ±1 minute, and older dates show the year when in a different year. Invalid inputs throw RangeError.
- **Product not carried at store (detail page):** when a product is viewed with a store scope where it is not carried (API returns empty `stockByStore`), the page displays an informational notice "This product is not carried at <Store>" with an action "View in all stores" that clears the store filter, avoiding misleading zero/out-of-stock data.
- **Import "unchanged" vs "updated" and movements:** `unchanged` means nothing changed: name, category, unit cost and quantity are all identical. If only name, category or cost changed, the row is `updated` and no movement is written. A movement of type `import` (note: the file name, cut to 200 chars) is written only when quantity delta is not 0.
- **New products have no supplier:** `supplier` is nullable (`string | null`) in ProductRecord, ProductListItem and ProductDetail. The UI hides the supplier line when null; the Details card shows an em dash.

- **Product id is the SKU.** URLs and API ids use the SKU (`/products/KL-1042`). It is unique, readable and stable in the seed. Import identifies products by SKU too. Gave up: a SKU can never be renamed without breaking links.
- **Idempotency key is global.** The repository stores keys without the user id. The request hash includes the product id and the body, so a key reused for another request gives 422 `IDEMPOTENCY_KEY_REUSED`. Two different users sending the same key with the same body would get the same replay. The client uses a random UUID per attempt, so this does not happen in practice. A real system would scope keys per user and expire them.
- **A replayed adjustment answers 201.** Same status and body as the first call, plus the `Idempotent-Replay: true` header, so a client cannot tell the difference except by that header. Import commit replays with 200 like its first answer.
- **Permission checks for adjustments.** The route handler parses `type` first and checks `ADJUSTMENT_PERMISSION[type]` so Staff requests for write-off/transfer immediately receive 403 `FORBIDDEN` even when the body is otherwise invalid. `createAdjustment` in the service also checks permissions as defense-in-depth. Import routes use the `withApi` permission option because the permission is fixed.
- **Test reset route.** `POST /api/test/reset` exists only in development or with `E2E=1` and answers 404 otherwise. It is the only seam Playwright needs.
- **Sample import file.** `samples/import-sample.csv` is generated from the seed by `npm run sample:import`: 63 rows, 8 broken ones (several error kinds), 15 new SKUs and 40 existing ones. Headers differ from the Stockroom names so auto-mapping can be seen working (`Item code`, `Description`, `Group`, `Qty`, `Cost (RM)`, plus `Barcode` and `Supplier`, which are skipped).
- **Node and framework versions.** Node 22 (`.nvmrc`), Next.js 16, React 19, Tailwind 4. The brief asks for Next.js 14 or later.
- **Loading states and server prefetch:** The first render has no skeleton on purpose because data and meta are prefetched on the server and hydrated directly into TanStack Query. Loading states can be inspected on demand with `?slow=1` (which skips prefetch so the client fetches through the API with the 500 ms simulated latency), or naturally while navigating when changing store, search, filters, sort, page, or page size. Error states are simulated with `?fail=1`. The table and card skeletons use TanStack Query's `isPlaceholderData`: when a new query key is requested, previous data becomes placeholder data, triggering skeleton rows with `aria-busy="true"` and polite live announcements while keeping the toolbar, headers, selection, and pagination intact. Conversely, a background refetch of the same key (such as after an adjustment mutation) keeps the existing rows visible without flashing skeletons.

## 4. Known gaps (decisions still open)

- **Component tests.** 3 component test files exist (`AdjustStockDialog.test.tsx`, `ProductsFiltersSheet.test.tsx`, `ProductsTable.test.tsx`, 21 tests total). Additional coverage for import wizard steps remains a future candidate.
- **Detail page `···` button.** The design shows one next to "Adjust stock" with no items defined. Not built on purpose (the products table row menu is built and opens "Adjust stock").
