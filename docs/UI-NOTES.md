# UI notes

Behavior taken from the Figma annotations (Shift+Y) and the Components page. This is the only place for these UI rules. Exact wording and formats are in `docs/SCREENS.md`. Decisions beyond the annotations are in `docs/DECISIONS.md`. Data rules are in `docs/API.md`.

## Shell

- **Sidebar:** fixed 248px. Store switcher, nav items, user card at the bottom. The store switcher value lives in the URL (`?store=mont-kiara`), not in local state.
- **Nav items:** default, active (light green fill, green icon, bold text), disabled. Suppliers and Reports are visible, disabled and tagged "Soon" (`aria-disabled`, not clickable). Import is hidden for Staff.
- **User card:** "Switch" opens a menu of the three users. Choosing one posts to the session route, refreshes the page and clears cached queries.
- **Toasts:** feedback after a mutation. At most one visible, a new one replaces the old one.
- **Tooltips:** dark, small, no arrow, 8px from the trigger. They work on keyboard focus too.

## Products list

- **Store switcher** scopes everything on the page: cards, table, totals. "All stores" adds the stores up. When a store is chosen a chip "Store: Mont Kiara" appears; its x goes back to "All stores".
- **Cards:** Products, Stock value, Low stock, Out of stock. Only Low stock and Out of stock are clickable (built, `aria-pressed`): a click filters the table by that status, a second click clears it. Products and Stock value are not clickable. Cards follow the store scope only. Low stock is amber, Out of stock is red.
- **Search** waits about 300 ms after typing. Search, category, status, sort, page and page size all live in the URL, so Back restores the previous view.
- **Sorting:** clicking a header cycles descending, then ascending, then off. One column at a time. Default is Updated, newest first (off means back to the default). The active `<th>` has `aria-sort`. For Status, descending means most urgent first (Out, Low, In stock).
- **Rows:** the whole row opens the product and keeps the store in the URL. The checkbox and the `···` button must not navigate. The design's menu has one item, Adjust stock (with "All stores" the dialog asks for a store first). Not built yet: the button renders and does nothing (see `docs/DECISIONS.md` section 4).
- **Out of stock:** 0 on hand is red and gets the Out of stock badge. Never red alone.
- **Chips:** one chip per active filter (search, category, status), plus the store chip when a store is chosen. "Clear all" resets search, category and status and keeps the store.
- **Selection (built):** the toolbar is replaced while at least one row is selected (indeterminate header checkbox, count, "Export selected", "Clear selection"). "Select all" selects the current page. Selection survives paging and resets when the store, search, category, status or the user changes. "Export selected" downloads a CSV of the selected rows, built in the browser with no API call. Selected rows can be on pages that are no longer loaded, so keep the selected row data (not only ids) in state.
- **Loading:** keep the header row, toolbar and pagination on screen. Only the rows become skeletons (one bar per column). Cards show the dash placeholder. Mark the table `aria-busy`.
- **No results** is "no results for the current filters", not "no products". "No products yet" is the other variant of the Empty state.
- **Error:** shown when the list request fails (`?fail=1`). "Try again" (banner link and centered button) refetches only the list, no page reload.
- **Pagination:** "Rows per page" select (25, 50, 100), range text in mono, previous and next icon buttons (disabled on the first and last page).
- **Export button (header):** exports every row of the current scope and filters in the current sort, in batches of 100 through the list API. It shows "Exporting…" and is disabled while running or when there are 0 products.
- **Responsive:** from 1024px the sidebar is fixed. Below it, a top bar with a menu button opens the sidebar as a slide-in sheet. The products table is used from 768px; below it each product is a card and the filters move into a bottom sheet. The product detail stacks to one column. Tables inside detail scroll horizontally with the first column sticky. The adjust dialog stays a dialog but its fields and footer stack under 640px.

## Product detail

- **Header:** breadcrumb, title with the status badge (it follows the scope totals), meta line, "Adjust stock" button.
- **Tabs:** underline tabs, `role="tablist"`, arrow keys move between tabs. The active tab is in the URL (`?tab=movements`). The count on Movements is the number of movements in the scope.
- **Adjust stock** opens the dialog for the current store. With "All stores" the dialog asks for a store first.
- **Chart:** daily closing on-hand for the scope. Range segmented control 7d, 30d (default), 90d. Tooltip on hover (built). Keyboard focus on the chart still has to be checked. The dashed line is the sum of the store reorder levels in the scope.
- **Stock by store:** status is per store, so a product can be In stock overall and Low at Subang. That is intended. Each row has "Adjust", which opens the dialog with that store already picked. Only stores that carry the product are listed.
- **Movements:** a transfer writes two rows (out and in) with the same time and note. Balance is that store's on hand right after the movement.
- **After any successful adjustment:** toast, then the list, the cards, Overview and the Movements tab all show the new numbers. No full page reload.

## Adjust stock dialog

- **Focus:** on open, focus goes to the selected type. Esc closes. On close, focus goes back to the button that opened it. Tab stays inside the dialog.
- **Validation:** on blur first, then live while the person fixes it. The server checks again. If the server answers 409 because stock changed in the meantime, show its message in the dialog and refresh the numbers in the dialog.
- **Submit button:** the label says exactly what will happen ("Transfer 24 units"). Disabled while invalid or saving. One click is one request, with an `Idempotency-Key`.
- **Staff:** Write-off and Transfer stay visible but locked, with a lock icon, using `aria-disabled` (not `disabled`) so the tooltip works with the keyboard. The API returns 403 as well.
- **Preview:** shows what each affected store will look like after saving, including the status it will move to (computed with the shared `getStatus`).
- **Transfer:** the "To" list leaves out the "From" store. A swap button exchanges them.
- **Footer** shows who is signed in.

## Import

- **Stepper:** Upload, Map columns, Review, Done. Finished steps show a check.
- **Upload:** drag and drop or click to browse. Reject non-CSV and files over 5 MB before upload, with the message under the dropzone. The store is chosen on this step.
- **Staff** should not reach the page (see DECISIONS), and the API returns 403.
- **Map columns:** auto-match by header name, case-insensitive (`sku`, `item code`, `code` all map to SKU). Each Stockroom field can be used once. Continue stays disabled until the 5 required fields are mapped. Unmapped columns are shown as "Skipped" with a banner.
- **Review:** validation happens on the server. The import request sends the file and the mapping and the server decides what is valid. Tabs All rows, Errors, Ready. "Download errors" gives the original rows plus an error column, so people can fix and re-upload.

## Components (specs from the Components page)

- **Button:** types Primary, Secondary, Ghost, Danger. States: default, hover, focus, disabled, loading ("Saving..." with a spinner). Focus ring: 1px focus border plus a 3px soft ring.
- **Checkbox:** off, on, indeterminate (header checkbox when only some rows are selected).
- **Input:** default, focus, error (danger border, message underneath in danger text), disabled.
- **Select:** default, open or focus, disabled. Optional leading icon (store icon on the store switcher).
- **Segmented option:** default, selected (raised white pill), disabled (lock icon and tooltip).
- **Inline alert:** error, warning, info. Full width of the container. The error one can have a "Try again" action.
- **Skeleton row:** bars roughly follow the columns.
- **Stat card:** three tones (default, amber, red).
- **Status badge:** pill with icon and text. Status is computed, never stored.
