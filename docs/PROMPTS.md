# Prompts

Nine prompts for the reduced scope in `docs/PLAN.md`. Copy one prompt at a time into your agent, in a new chat. The agent reads `AGENTS.md` by itself (scope rule, UI-lite rule, git rules, final message format), so the prompts only contain the task and the feature checklist.

How to use:

1. Attach the Figma screenshot named in the prompt (if any). Say nothing else about styling.
2. Read the diff, run the app, commit yourself. UI polish comes later, when the agent is unavailable.
3. If the agent skips an item from the checklist, paste: `You skipped: <items>. Do only those.`
4. If a check fails twice: `npm run check` failed. Failing lines: <paste only those lines>. Fix only the cause.

Every task also follows these project rules (already in AGENTS.md): types come from `src/types/`, files are camelCase, icons come from `src/components/icons`.

Assumption: Phase 0 (project, tooling, tokens) and the backend (domain rules, repository, routes, adjustments) exist. If a route listed in `docs/API.md` is missing, tell the agent in the first prompt.

---

## 1. Shell, URL state, list foundation (about 2h)

Attach: Products screen (default state).

```
Follow AGENTS.md. Task: app shell and the foundation of the products list.
Read: docs/UI-NOTES.md (Shell, Products list), docs/SCREENS.md (Names, Formats, Products list), docs/API.md (Session, /api/meta, GET /api/products), docs/ARCHITECTURE.md (First render and TanStack Query).

Feature checklist:
1. Layout with a fixed 248px sidebar: logo block, store switcher ("All stores (6)" and the 6 stores, value in the URL as ?store=<id>), nav items Products and Suppliers and Reports (the last two disabled, aria-disabled, with the "Soon" tag), user card with a "Switch" menu listing the 3 users (POST /api/session, then router.refresh and clear the query cache). Do not add an Import link. Below 1024px the sidebar sits behind a menu button (sheet) with the same content.
2. src/lib/client/queryKeys.ts (all query keys built here), a small typed API client, a QueryClientProvider.
3. URL-state helpers (parse and write): store, q, category, status, sort, dir, page, pageSize. Only non-default values go in the URL. Defaults: store all, sort updatedAt desc, pageSize 25 (options 25, 50, 100). Clicking a sortable header toggles desc, then asc. Changing store, search, category, status or page size resets page to 1. Search uses router.replace, everything else router.push, so Back works.
4. Products page as a Server Component: prefetch the list with the same query key and pass it through HydrationBoundary (a failed prefetch is not dehydrated). A client component reads it with useQuery.
5. Table with the columns from docs/SCREENS.md (no checkbox column, no row menu): SKU, Product (name with the supplier on a second line), Category, On hand, Reorder at, Status, Unit cost, Updated. SKU, numbers and money use the mono text styles. Status badge with icon and text. 0 on hand is red plus the Out of stock badge. Updated uses formatWhen. aria-sort on the active sorted th.
6. The whole row opens /products/<id> and keeps ?store. Keyboard users get a real link on the product name.
7. Pagination: "Rows per page" select, range text like "1–25 of 248", previous and next buttons.
```

## 2. List features and states (about 1.5h)

Attach: Products screens: default, loading, no results, error.

```
Follow AGENTS.md. Task: finish the products list.
Read: docs/UI-NOTES.md (Products list), docs/SCREENS.md (Products list).

Feature checklist:
1. Header: title "Products" and the subtitle ("248 products across 6 stores", or "212 products at Mont Kiara" for one store). No Export or Import buttons.
2. Toolbar: search input with placeholder "Search name or SKU" (300 ms debounce), "All categories" select, "All statuses" select (All statuses, In stock, Low, Out of stock), result count on the right ("248 results").
3. Four summary cards with the exact titles, values and subtitles, display only (Low stock number in amber, Out of stock in red, the other two default). Values come from the list response summary. Stock value is shown as RM with thousands separators.
4. Loading state: the header row, toolbar and pagination stay; only the rows become skeletons (one bar per column); cards show the dash placeholder; the table has aria-busy.
5. Two different empty states: "No products yet" (catalogue is empty) and "No products match these filters" with a "Clear filters" button.
6. Error state: the red banner "We couldn't load products" with a "Try again" link and the centered "Something went wrong" state with a "Try again" button. Both refetch only the list. Old data stays visible if there is any.
7. When a store is chosen, the cards and the subtitle show that store's numbers (the API already scopes them).
```

## 3. Product detail and Movements (about 2h)

Attach: Product Overview screen, Product Movements screen.

```
Follow AGENTS.md. Task: the product detail page.
Read: docs/UI-NOTES.md (Product detail), docs/SCREENS.md (Product detail), docs/API.md (GET /api/products/:id, movements).

Feature checklist:
1. Server Component page that prefetches the product and the first movements page into TanStack Query with the same query keys as the client. The store scope comes from ?store.
2. Header: breadcrumb "Products > <name>", title with the status badge (follows the scope totals), meta line (SKU chip, category, supplier, unit cost as "RM 68.00 per unit"), and an "Adjust stock" button that calls an onAdjust callback (the dialog comes in prompt 5).
3. Tabs "Overview" and "Movements" (with the count). Use the shadcn tabs. The active tab lives in the URL (?tab=movements), arrow keys move between tabs.
4. Overview, details card with the exact rows: On hand (all stores), Reorder level, Unit cost, Stock value, Supplier, Last movement (formatWhen). With one store selected the first label is "On hand".
5. Overview, "Stock by store" table: only stores that carry the product; columns Store, On hand, Reorder at, Status badge, Last movement, and an "Adjust" button per row (calls onAdjust with that store). Amber text "N of M stores need attention" (stores that are Low or Out of stock). Leave a clearly marked empty area where the chart will go (prompt 4).
6. Movements tab: type select ("All types" plus the six types), table with columns Date & time (newest first), Type (pill with icon and color per type), Store (for transfers "Mont Kiara → Subang" on the out row and "Subang ← Mont Kiara" on the in row), Change (red or green, true minus sign), Balance, By (initials and name), Note, and pagination with Rows per page.
7. States: loading skeletons, error with Try again, "No movements yet" (no button) and "No movements match these filters" (with Clear filters) as different states.
```

## 4. Chart (about 45m)

Attach: Product Overview screen.

```
Follow AGENTS.md. Task: the stock chart on the product Overview tab.
Read: docs/SCREENS.md (Product detail), docs/API.md (stock-history), docs/DECISIONS.md section 1 (chart with one point).

Feature checklist:
1. Card titled "On hand, last 30 days" with the subtitle "All stores combined · reorder level is the sum of store levels" (just the store name when one store is selected).
2. Recharts line chart of the daily closing on-hand for the store scope (use days=30), with a dashed amber horizontal line at the summed reorder level and a legend ("On hand", "Reorder level (N)"). Axes: dates like "14 Sep" and "Today", numbers on the y axis. Colors from theme tokens only.
3. One data point is drawn as a visible dot with a short caption; zero points shows a small empty state. Never invent data.
4. Loading skeleton and an error state with Try again inside the card. Wrap the chart so it also has a text alternative (aria-label or a visually hidden summary).
No tooltip, no 7d or 90d buttons.
```

## 5. Adjust dialog: form (about 1.5h)

Attach: the three dialog screens (Transfer with error, Staff locked, Sell).

```
Follow AGENTS.md. Task: the Adjust stock dialog UI (no network yet beyond a callback).
Read: docs/UI-NOTES.md (Adjust stock dialog), docs/SCREENS.md (Adjust stock dialog), docs/API.md (adjustments rules), src/lib/domain/schemas.ts and stockRules.ts (reuse them).

Feature checklist:
1. A reusable component with props: product (id, name, SKU), the list of stores that carry it with their on hand, an optional initial store, an onSubmit callback, an opener ref. Use the shadcn Dialog (it provides the focus trap, Esc and focus return; verify focus returns to the opener).
2. Header "Adjust stock", close button, SKU chip and product name. Segmented control with Receive, Sell, Write-off, Transfer.
3. Fields per type: Sell: Store, Quantity. Receive: Store, Quantity, Note. Write-off: Store, Quantity, Reason (required). Transfer: From, To, Quantity, Note. Store options read "Subang · 4 on hand". If no initial store is given, the store field starts empty and the person must choose. In Transfer the "To" list leaves out the "From" store.
4. Validation with the same Zod schema the server uses, on blur and then live. Exact texts: "Whole units only." helper, "Enter a whole number above 0.", "<Store> only has <n> on hand. Enter <n> or less.", "Enter a reason (at least 3 characters)."
5. Submit button label says exactly what will happen: "Receive 20 units", "Sell 2 units", "Write off 1 unit", "Transfer 24 units" (unit for 1); disabled while invalid or saving. While saving it reads "Saving..." with a spinner, fields are disabled, the dialog cannot be closed. Footer shows "Signed in as <name> (<role>)" and a Cancel button.
6. Staff: Write-off and Transfer are visible, show a lock icon, use aria-disabled (not disabled), and show the tooltip "Only managers can write off or transfer stock", also on keyboard focus.
7. A prop for a server error message that is shown in the dialog without clearing the typed values.
Wire it to the buttons from prompt 3 only with a local open state and a console-free no-op submit for now.
```

## 6. Adjust dialog: wiring (about 1.5h)

```
Follow AGENTS.md. Task: connect the Adjust stock dialog to the API.
Read: docs/ARCHITECTURE.md (Writes and cache updates, Idempotency), docs/UI-NOTES.md (Adjust stock dialog), docs/SCREENS.md (Toasts), docs/API.md (adjustments).

Feature checklist:
1. useMutation that POSTs to /api/products/:id/adjustments with an Idempotency-Key header. One key per payload: create it on first submit, reuse it for a retry of the same payload, create a new one after success or after the person edits the form.
2. On success: close the dialog, show a sonner toast (one at a time, bottom right) with the exact texts from docs/SCREENS.md, and invalidate every affected query: the products list queries (including the cards), the product detail, stock by store, movements and the chart. Everything shows the new numbers without a page reload.
3. On 409 INSUFFICIENT_STOCK or any other API error: keep the dialog open, keep the typed values, show the server message inside the dialog, and refetch the product so the numbers in the dialog are current.
4. A double click or a slow-connection retry must not create two requests for one submit (disable while pending) and must reuse the key.
5. Staff cannot reach the locked types; the server also returns 403 (already built), show its message if it ever happens.
6. The "Adjust stock" button and every per-store "Adjust" button open the dialog with the right store preselected (the header button uses the store from ?store if one is chosen).
```

## 7. CSV validation, validate route and tests (about 1.5h)

```
Follow AGENTS.md. Task: server-side CSV row validation. This is the only import work; there is no import UI and no commit route.
Read: docs/IMPORT.md, docs/ARCHITECTURE.md (Contracts: importValidation, importsService parseCsv), docs/SCREENS.md (Import, problem messages), docs/API.md (/api/imports/validate).

Feature checklist:
1. src/lib/domain/importValidation.ts: validateImportRow(row, context) exactly as in the Contracts, with the exact messages from docs/SCREENS.md. Money parsed to sen without floats.
2. src/lib/server/services/importsService.ts: parseCsv with papaparse (header row, skip empty lines, BOM, max 2000 rows, 5 MB) and a validate function that numbers rows from 1 and marks later duplicate SKUs ("Same SKU as row N").
3. POST /api/imports/validate: multipart/form-data with file, storeId and mapping; Manager only through withApi (Staff get 403); returns the per-row results and the summary from docs/API.md; saves nothing. Errors: 413 FILE_TOO_LARGE, 422 INVALID_FILE, 422 IMPORT_TOO_LARGE.
4. Tests (write them now): validateImportRow with at least six kinds of problem (missing SKU, negative quantity, decimal quantity, non-numeric unit cost, missing unit cost, unknown category, duplicate SKU, name too long), plus a valid row that is create and one that is update; route tests: Staff gets 403, Manager gets results, nothing is saved.
5. samples/import-sample.csv with at least 50 rows, different header names ("Item code", "Description", "Group", "Qty", "Cost (RM)"), a few existing SKUs, a few new ones and broken rows of at least five kinds.
```

## 8. Playwright (about 1.5h)

```
Follow AGENTS.md. Task: the two Playwright tests from the brief.
Read: docs/SCREENS.md (names), docs/API.md (/api/test/reset, session), the existing playwright.config.ts.

Feature checklist:
1. e2e/managerTransfer.spec.ts: reset the store; sign in as Aina Rahman (Manager) with the user switcher (or set the stockroom_user cookie); on the products list filter (for example category Coffee), open a product, open Adjust stock, choose Transfer, move some units between two stores, and check that both stores' numbers changed in the Stock by store table (and the toast appeared).
2. e2e/staffLocked.spec.ts: reset the store; as Faiz Hakim (Staff) open a product and the dialog; Write-off and Transfer are aria-disabled; also a direct POST to the adjustments API with type transfer returns 403.
3. Use role and label locators only, no waitForTimeout. Each test calls the reset route first.
4. Run `npm run e2e` once at the end. If a test is flaky, report which one and why instead of looping.
If you must make a small change in the app to make something testable (for example an accessible name), list it in the final message.
```

## 9. README and deploy (about 1.5h)

```
Follow AGENTS.md. Task: fill the TODO(devin) sections of README.md from the real code, with file names. Do not touch TODO(hanie) sections. Make sure the Quick start, Scripts and Tests sections are correct from a clean clone. Add the "What I cut" list from docs/PLAN.md as a starting point under a clearly marked TODO(hanie) so I can edit it. Run `npm run check:full` once.
```

Then you do: connect Vercel, deploy, click through the main flows on the live URL, write the TODO(hanie) sections (decisions from `docs/DECISIONS.md`, AI usage, what I cut, next, three changes), send the email.
