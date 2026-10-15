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
The link is hidden in the sidebar. If Staff open the URL anyway, the page (checked on the server) renders a "Managers only" screen with a short explanation and a link back to Products. No silent redirect, because the person should understand why. The API also returns 403 for them anyway.

**Saving state inside the dialog**
While the request runs: the submit button shows a spinner and "Saving...", all fields are disabled, and closing is disabled until the request ends so the person cannot lose the result. On error the dialog stays open, keeps the typed values, shows the message at the top (and field messages under fields), and the button becomes "Try again". A retry reuses the same idempotency key for the same payload. On success, the dialog shows the new numbers for a moment, then closes and returns focus to the button that opened it. `[verify the success moment against Figma]`

## 3. Other decisions

- **Summary cards ignore the search and filters.** They only follow the store scope. Otherwise clicking "Low stock" would change the very number you just clicked. `[verify]`
- **Selection:** "select all" selects the current page only. Selection is cleared when the store, search or filters change, and kept when only the page changes. Export CSV contains the selected rows as they are shown in the current scope (SKU, name, category, status, on hand, reorder level, unit cost). Money in the export uses the `68.00` form.
- **URL state:** only non-default values are written to the URL. Filters, store, sort and page use `router.push` so Back works; the search box is debounced and uses `router.replace` while typing so history is not flooded. Changing a filter, search or the store resets page to 1.
- **Defaults:** sort by SKU ascending, page size 10 (options 10, 25, 50). `[verify]`
- **Write-off reason:** a required text field, trimmed, 3 to 200 characters. If Figma shows preset reasons, use them plus "Other" with text. `[verify]`
- **Error with old data on screen:** keep the old data visible and marked as possibly out of date, with a clear error banner and a Retry button. An error is never shown as "0 stock".
- **Role handling:** a missing or invalid cookie means Staff. The switcher posts to `/api/session` and then refreshes the router and clears the query cache.
- **Chart data:** rebuilt from movements, going backwards from today's stock. The seed generator makes movements that add up to the current stock so the chart and the numbers agree.
