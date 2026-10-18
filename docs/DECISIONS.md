# Decisions

Format: what I chose, why, and what I gave up. Items marked `[verify]` need a quick check against the Figma Screens page before this goes into the README.

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

- 768 to 1023px: sidebar collapses into a top bar with a menu button; the table stays a table but scrolls horizontally inside its own container, with the SKU and Name columns sticky.
- Under 768px (down to 375px): the sidebar becomes a slide-in menu holding the store switcher and the user switcher; table rows become cards (name, SKU, status badge with text, on hand and reorder level); filters collapse into one "Filters" sheet; the adjust dialog becomes a full-height sheet; pagination controls stay reachable with 44px touch targets.
- Why: a table is still the best format when it fits, and cards avoid sideways scrolling on phones.

**Import "Done" step**
A summary with counts (created, updated, unchanged, skipped), a "Download skipped rows" button when anything was skipped, a link to the products list scoped to the imported store, and "Import another file". The counts come from the commit response, not from the review.

**Product with no movements (Movements tab empty)**
Its own empty state: "No movements yet" with one sentence of explanation, and a "Receive stock" button that opens the dialog. This is different from "no results for these filters" on the same tab, which says that the filters matched nothing and offers "Clear filters".

**Staff opens /import directly**
The link is hidden in the sidebar. If Staff open the URL anyway, the server-side page check redirects them to Products (as the Figma note suggests) with `?notice=managers-only`, and the list shows a small dismissible message "Import is available to managers only", so the person still understands why. The API also returns 403. (An earlier idea was a separate "Managers only" screen; the redirect is less code and follows the design.)

**Saving state inside the dialog**
While the request runs: the submit button shows a spinner and "Saving...", all fields are disabled, and closing is disabled until the request ends so the person cannot lose the result. On error the dialog stays open, keeps the typed values, shows the message at the top (and field messages under fields), and the button becomes "Try again". A retry reuses the same idempotency key for the same payload. On success, a toast appears, the dialog closes and focus returns to the button that opened it.

## 3. Other decisions

- **Summary cards ignore the search and filters.** They only follow the store scope. Otherwise clicking "Low stock" would change the very number you just clicked. The Figma note says the store scopes "cards, table, totals" and does not mention filters.
- **Selection:** "select all" selects the current page only. Selection is cleared when the store, search or filters change (the design says a filter change resets it), and kept when only the page changes. The state keeps the selected rows' data, since rows from other pages are not loaded. Export CSV contains the selected rows as they are shown in the current scope (SKU, name, category, status, on hand, reorder level, unit cost). Money in the export uses the `68.00` form.
- **URL state:** only non-default values are written to the URL. Filters, store, sort and page use `router.push` so Back works; the search box is debounced and uses `router.replace` while typing so history is not flooded. Changing a filter, search or the store resets page to 1.
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
