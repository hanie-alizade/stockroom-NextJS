# Prompts

Small steps with ready prompts. Phases and goals are in `docs/PLAN.md`. The agent skills are in `.devin/skills/`, git and cost rules in `.devin/rules/`.

## How to use

1. Start a new chat for every step. Paste the step prompt. Tester and Reviewer steps must never share a chat with the Builder.
2. The agent leaves changes in the working tree and never commits. Read them (`git diff`), run `npm run check` yourself if you want, accept them, then commit yourself.
3. Commits:
   - Builder steps: normal commit. Hooks run (`lint-staged`, `tsc` before the commit, `npm run check` before push).
   - Test-first steps: the tests fail on purpose and cannot compile yet, so use `git commit --no-verify -m "test(<scope>): add failing tests for <thing>"`. Do not push red tests alone. Push after the Builder step makes them green.
4. If the agent reports `TEST/CONTRACT MISMATCH`, decide who is wrong (the test or the Contracts) and fix it in a new step. The Builder never edits tests.
5. After a Builder step with problems, use the Fix prompt in the same chat. If a check fails when you run it yourself, paste only the failing lines with the Check failed prompt.

## Always-present prompt tail

Every Builder prompt ends with: `Do only this step. Final message in the skill's report format.`

## Reusable prompts

**Fix (same chat as the Builder)**

```
Use skill build-step. Fix only these findings, nothing else:
<paste chosen findings>
```

**Check failed (same chat as the Builder)**

```
Use skill build-step. `npm run check` failed. Failing lines:
<paste only the failing lines>
Fix the cause only.
```

**Review (R1, R2, R3, new chat)**

```
Use skill review-step. Range: <first-commit-of-the-phase>^..HEAD
Focus: <for example "adjustments, idempotency, transfer" or "permissions and import">
```

---

## Phase 0: Foundations

**0.1 Scaffold** (Builder)

```
Use skill build-step.
Step 0.1: create the Next.js app in the repo root: App Router, TypeScript strict, Tailwind, src/ directory, `@/` alias. Add shadcn/ui and src/lib/utils.ts with cn(). Keep every existing file (docs, .devin, .husky, .github, scripts, configs); do not overwrite them.
package.json scripts, all must exit by themselves (no watch, no prompts): dev, build, start, typecheck (tsc --noEmit), lint (eslint .), format:check (prettier --check .), check:rules (node scripts/check-rules.mjs), test (vitest run --passWithNoTests), check (typecheck, lint, check:rules, test; stop at first failure), check:full (check, then build), e2e (playwright test --pass-with-no-tests).
Leave a placeholder home page. No other pages.
```

**0.2 Lint, format, hooks** (Builder)

```
Use skill build-step.
Step 0.2: ESLint, Prettier, hooks. eslint.config.mjs already exists and is incomplete: complete it, keep what works. Rules as errors: @typescript-eslint/no-explicit-any, no-non-null-assertion, consistent-type-imports, consistent-type-assertions {assertionStyle: "never"} (only `as const`), explicit-module-boundary-types, no-floating-promises (type-aware: parserOptions.projectService); no-restricted-syntax for TSEnumDeclaration; ban default exports except Next files (page, layout, loading, error, not-found) and config files; no-restricted-imports for "../../*"; no-console; eqeqeq; no-nested-ternary; react-hooks rules; max-lines 250 as a warning; import/order only if it does not fight Prettier.
Prettier is configured in .prettierrc.json (tailwind plugin). Add "prepare": "husky" and make sure husky and lint-staged are installed. Do NOT run `husky init`: .husky/pre-commit, .husky/pre-push, .lintstagedrc.json and .gitattributes already exist, keep them.
Prove the rules work: create a temporary file with `any`, `as string`, an enum and console.log, confirm ESLint reports each one, then delete the file.
Docs: docs/CONVENTIONS.md.
```

**0.3 Test tooling** (Builder)

```
Use skill build-step.
Step 0.3: test tooling. Do not write test files.
- vitest.config.ts: keep, but exclude "e2e/**" and "node_modules/**" so Vitest never runs Playwright specs.
- tests/setup.ts: import "@testing-library/jest-dom/vitest". Keep tests/builders.ts as an empty module.
- playwright.config.ts: replace it completely: testDir ./e2e, chromium only, retries 0, workers 1, fullyParallel false, forbidOnly true, reporter "line", webServer command "npm run build && npm run start" with env E2E=1 and SIMULATED_LATENCY_MS=0, reuseExistingServer false.
Update the Commands table in AGENTS.md and the Scripts and Tests sections of README.md.
```

**0.4 Theme tokens** (Builder)

```
Use skill build-step.
Step 0.4: design tokens. Files: src/app/globals.css, src/app/layout.tsx, src/app/page.tsx, README.md (a short "Tokens" section under Tech stack). The design has one theme: remove the dark-mode media query and the Arial body font.
1) In :root define the primitives (never exposed as Tailwind colors):
--stone-0:#FFFFFF; --stone-25:#FBFAF8; --stone-50:#F6F4F1; --stone-100:#EEEBE6; --stone-200:#E2DED7; --stone-300:#CFC9BF; --stone-400:#A39C91; --stone-500:#7A7368; --stone-600:#5C564D; --stone-900:#1E1B17;
--green-50:#ECF5F1; --green-100:#D3E8DF; --green-600:#2F6B55; --green-700:#24563F; --green-800:#1B4232;
--sage-50:#EEF4EC; --sage-700:#3D6B2E; --amber-50:#FDF4E3; --amber-200:#F2D8A4; --amber-700:#8A5A0B;
--red-50:#FCEBEA; --red-200:#F2C2BE; --red-600:#B4352B; --red-700:#962A22;
--blue-50:#EAF1FB; --blue-700:#2554A3; --violet-50:#F1ECF9; --violet-700:#5B3F99;
2) In :root define the semantic tokens (Figma name = primitive; variables are --bg-canvas, --text-primary, and so on):
bg-canvas=stone-50; bg-surface=stone-0; bg-subtle=stone-25; bg-muted=stone-100; bg-overlay=stone-900;
border-default=stone-200; border-strong=stone-300; border-focus=green-600;
text-primary=stone-900; text-secondary=stone-600; text-tertiary=stone-500; text-disabled=stone-400; text-on-accent=stone-0; text-link=green-700;
accent-default=green-700; accent-hover=green-800; accent-subtle=green-50; accent-disabled=green-100;
status-ok-bg=sage-50; status-ok-fg=sage-700; status-warn-bg=amber-50; status-warn-fg=amber-700; status-warn-border=amber-200;
status-danger-bg=red-50; status-danger-fg=red-700; status-danger-border=red-200; status-danger-solid=red-600;
status-info-bg=blue-50; status-info-fg=blue-700; status-transfer-bg=violet-50; status-transfer-fg=violet-700.
3) `@theme { --color-*: initial; }` removes the default Tailwind palette (keep transparent, current, inherit). In `@theme inline` expose ONLY the semantic tokens as --color-<name>: var(--<name>), so classes are bg-bg-canvas, text-text-primary, border-border-default, bg-accent-default, bg-status-warn-bg, text-status-danger-fg. If removing the default palette breaks the build, say so and stop.
4) shadcn aliases (in :root and exposed in @theme inline): --background=bg-canvas; --foreground=text-primary; --card=bg-surface; --card-foreground=text-primary; --popover=bg-surface; --popover-foreground=text-primary; --primary=accent-default; --primary-foreground=text-on-accent; --secondary=bg-muted; --secondary-foreground=text-primary; --muted=bg-muted; --muted-foreground=text-secondary; --accent=accent-subtle; --accent-foreground=accent-default; --destructive=status-danger-solid; --destructive-foreground=text-on-accent; --border=border-default; --input=border-strong; --ring=border-focus.
5) Fonts: load IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500) with next/font/google as --font-plex-sans and --font-plex-mono; replace Geist; body uses Plex Sans.
6) Text styles as Tailwind utilities with @utility, each setting font-family, font-size, line-height and weight: text-page-title (Sans 600 24/32), text-section (Sans 600 18/26), text-card (Sans 600 15/22), text-body (Sans 400 14/20), text-body-strong (Sans 500 14/20), text-body-small (Sans 400 13/18), text-label (Sans 500 13/18), text-overline (Sans 600 11/16, uppercase, letter-spacing 0.06em, comment TODO(hanie): confirm), text-caption (Sans 400 12/16), text-numeric-large (Sans 600 26/32), text-mono (Mono 400 13/18), text-mono-strong (Mono 500 13/18).
7) Spacing: keep Tailwind's scale and add named tokens in @theme: --spacing-2xs 2px, xs 4px, sm 8px, md 12px, lg 16px, xl 20px, 2xl 24px, 3xl 32px, 4xl 40px. Radius in @theme: --radius-sm 4px, md 6px, lg 8px, xl 12px, full 9999px.
8) Shadows in @theme: --shadow-card: 0 1px 2px 0 #1F1A140D; --shadow-popover: 0 4px 12px 0 #1F1A1414, 0 1px 3px 0 #1F1A140F; --shadow-dialog: 0 24px 48px 0 #1F1A142E, 0 2px 6px 0 #1F1A140F (comment TODO(hanie): second layers are my reading of the Figma export). Add a `focus-ring` utility: border-color var(--border-focus) and box-shadow 0 0 0 3px #2F6B5547.
9) Update src/app/page.tsx to use only the new tokens and text styles (no zinc, no dark: classes), title "Stockroom". Install lucide-react (icons use size 16, strokeWidth 1.8).
Hex values are allowed only in globals.css.
Note for later: after `npx shadcn add dialog`, replace the generated bg-black overlay with bg-bg-overlay/60.
```

**0.5 You:** connect the repo to Vercel and deploy the placeholder.

---

## Phase 1: Domain rules and API

Brief rules to paste into the test-first prompts below are marked `<BRIEF: ...>`.

**1.1 Seed data** (Builder)

```
Use skill build-step.
Step 1.1: write scripts/generate-seed.ts (seeded PRNG, deterministic) and generate data/seed.json. Read docs/ARCHITECTURE.md (Seed data) and docs/SCREENS.md (Names) first.
- 6 stores (ids mont-kiara, subang, damansara, cheras, puchong, shah-alam), 6 categories, 7 suppliers, 3 users, 248 products (sku KL-####, name, category, supplier, unitCostSen).
- A product is carried at some stores only: stock rows with onHand and reorderLevel per carried store. Mont Kiara carries exactly 212 products.
- 90 days of movements per product that add up to the current stock, each with a note (string or null), the user who made it, and transfers as linked pairs (same transferId, same time, same note).
- Fixtures: KL-1042 Arabica beans 1 kg (Coffee, Highland Roasters, 6800 sen; Mont Kiara 18, Subang 4, Cheras 0, Damansara 22, Puchong 15, Shah Alam 25; reorder level 5 everywhere); KL-1043 Robusta beans 1 kg; KL-2210 Oat milk 1 L (out of stock everywhere).
- On purpose: low stock, reorder level 0, a product with no movements, a product with one history point, a product not carried at some stores, two long names.
No services or routes yet.
```

**1.2 Tests: status, money, policy** (Tester first)

```
Use skill test-first.
Step 1.2: tests for src/lib/domain/status.ts, money.ts, policy.ts, dates.ts (Contracts in docs/ARCHITECTURE.md).
<BRIEF: Status is calculated. Out of stock = 0. Low = more than 0 and at or below the reorder level. Everything else is In stock. For "All stores", on hand and reorder level are summed first. Money is whole sen (6800 shown as 68.00 in tables, RM 68.00 in sentences). Staff: view, receive, sell. Manager: everything.>
Edge cases: docs/DECISIONS.md section 1 (reorder level 0). Money: thousands separators ("1,234.50", "RM 182,430.50") and 0. Dates: formatWhen gives "2h ago" under 12 hours, "Today, 09:10" the same day, "Yesterday", "12 Oct" for older; formatDateTime gives "14 Oct, 10:58". Pass `now` explicitly. Formats: docs/SCREENS.md.
```

**1.3 Implement** (Builder)

```
Use skill build-step.
Step 1.3: implement src/lib/domain/errors.ts, status.ts, money.ts, policy.ts so the existing tests pass. Contracts: docs/ARCHITECTURE.md.
```

**1.4 Tests: stock rules** (Tester first)

```
Use skill test-first.
Step 1.4: tests for src/lib/domain/stock-rules.ts.
<BRIEF: Quantities are whole numbers above zero. Selling, writing off or transferring cannot take a store below zero. A transfer moves stock from one store to another and creates two movements, one out and one in; both are saved or neither is. Transfer to the same store is not allowed.>
Cover: quantity 0, negative, decimal, NaN; exactly zero remaining is allowed; one too many is rejected; the two transfer movements sum to zero and share a transferId; balanceAfter values; same-store error code and field error.
```

**1.5 Implement** (Builder)

```
Use skill build-step.
Step 1.5: implement src/lib/domain/stock-rules.ts and src/lib/domain/schemas.ts (Zod: adjustmentSchema as a union on type, productListQuerySchema, importRequestSchema). Make the existing tests pass. Docs: docs/ARCHITECTURE.md Contracts, docs/API.md.
```

**1.6 Repository** (Builder)

```
Use skill build-step.
Step 1.6: repository interface (src/lib/server/repo/types.ts), in-memory implementation kept on globalThis, loaded from data/seed.json, and src/lib/server/repo/index.ts. The interface only has what the rules need, including a transaction(fn) where fn runs synchronously and touched rows are restored if it throws. No services or routes yet. Docs: docs/ARCHITECTURE.md (Layers, Transfer consistency, In-memory store details).
```

**1.7 Tests: withApi** (Tester first)

```
Use skill test-first.
Step 1.7: tests for the `withApi` wrapper at src/lib/server/http/with-api.ts (set SIMULATED_LATENCY_MS=0 in tests).
<BRIEF: Check permissions on the server: a Staff request for a write-off, a transfer or an import must get 403. Use one error format everywhere with a code the frontend can rely on, for example { "error": "INSUFFICIENT_STOCK", "message": "...", "fieldErrors": [] }. Add a way to force a failure (like ?fail=1).>
Cover: the role comes from the user in the stockroom_user cookie (aina-rahman is manager, faiz-hakim is staff); a missing or unknown cookie falls back to the Staff user faiz-hakim; a client cannot set a role directly; 403 FORBIDDEN shape; ?fail=1 returns 500 INTERNAL_ERROR and does not run the handler; AppError and ZodError map to the standard shape; invalid JSON gives 400 INVALID_JSON. Docs: docs/API.md (Session, Error format, Codes).
```

Suggested commit: feat(server): add repository interface and in-memory implementation

**1.8 Implement withApi and small routes** (Builder)

```
Use skill build-step.
Step 1.8: implement withApi and the routes /api/session (POST with { userId }), /api/meta (GET: stores, categories, users, current user), /api/test/reset (POST, only in dev or E2E=1). Make the existing tests pass. Docs: docs/API.md, docs/ARCHITECTURE.md (Request wrapper).
```

**1.9 Read routes** (Builder)

```
Use skill build-step.
Step 1.9: services and routes for GET /api/products (store scope, search, category, status, sort, dir, page, pageSize 25/50/100; items include supplier and updatedAt; summary has totalProducts, stockValueSen, lowStock, outOfStock; default sort is updatedAt desc; only products carried at the scope), GET /api/products/:id (supplier, stockValueSen, lastMovementAt, stockByStore only for stores that carry it, each with lastMovementAt), GET /api/products/:id/movements (type, period 7d/30d/90d, paging, total, by, counterpartStoreId), GET /api/products/:id/stock-history (days 7/30/90, points and summed reorderLevel). Docs: docs/API.md, docs/DECISIONS.md (status sort direction, summary cards, search).
```

**1.10 Tests: read routes** (Tester after)

```
Use skill test-after.
Step 1.10: route tests for the four read routes.
Cover: All stores sums on hand and reorder level over the stores that carry the product and derives status from the sums; store scope only lists products carried there (Mont Kiara has 212, all stores 248); search by name and SKU; category and status filters; default sort is updatedAt desc; status sort (dir=desc gives out, low, in stock; asc reverses; ties by SKU); page sizes 25, 50, 100 and total; summary has stockValueSen and ignores filters; fixture KL-1042 has 84 on hand, 30 reorder level and 6 stock-by-store rows, with Cheras out of stock and Subang low; unknown product 404 PRODUCT_NOT_FOUND; stock-history returns one point for the one-point product, none invented, and the summed reorderLevel for the scope; movements filters, period, newest first, and a transfer shows both rows with counterpartStoreId. Docs: docs/API.md, docs/DECISIONS.md.
```

**1.11 Tests: adjustments** (Tester first)

```
Use skill test-first.
Step 1.11: route tests for POST /api/products/:id/adjustments and createAdjustment (docs/API.md).
<BRIEF: Staff can receive and sell; managers can also write off, transfer and import. A Staff request for a write-off, a transfer or an import must get a 403. Overselling returns your error code. A write-off needs a reason. A transfer creates two movements, one out and one in; both are saved or neither is. A double click or a retry on a slow connection must never apply the same change twice (Idempotency-Key header).>
Cover: Staff gets 403 for write_off and transfer, and still can receive and sell; oversell returns 409 INSUFFICIENT_STOCK with the message "Mont Kiara only has 18 on hand. Enter 18 or less." and changes nothing; write-off without a note is 422; same-store transfer is 422; a store that does not carry the product is 422 NOT_STOCKED_AT_STORE; same key and same payload twice applies once and returns the same response with Idempotent-Replay; same key with another payload is 422 IDEMPOTENCY_KEY_REUSED; missing key is 400; transfer creates exactly two movements with one transferId and the same note, and total stock is unchanged; movements record the user (by); ?fail=1 changes nothing. Reset the store in beforeEach.
```

**1.12 Implement adjustments** (Builder)

```
Use skill build-step.
Step 1.12: implement createAdjustment (src/lib/server/services/inventory.service.ts) and the adjustments route so the existing tests pass. Idempotency check and stock write happen in the same synchronous critical section. Docs: docs/ARCHITECTURE.md (Idempotency, Transfer consistency), docs/API.md.
Phase end: also run `npm run check:full`.
```

**R1** Review (see Reusable prompts), focus: adjustments, idempotency, transfer, permissions.

---

## Phase 2: App shell and Products list

**2.1 Shell** (Builder)

```
Use skill build-step.
Step 2.1: app layout per docs/UI-NOTES.md (Shell) and docs/SCREENS.md (Names): fixed 248px sidebar with logo, store switcher ("All stores (6)" plus the 6 stores, in the URL as ?store=<id>), nav items (Products, Import for Managers only, Suppliers and Reports disabled with the "Soon" tag), user card with a "Switch" menu listing the 3 users (posts to /api/session, refreshes, clears queries), mobile menu below 1024px (slide-in sidebar with the same content). Docs: docs/DECISIONS.md section 2 (below 1024px).
```

**2.2 Query layer and URL state** (Builder)

```
Use skill build-step.
Step 2.2: src/lib/client/query-keys.ts, a typed API client, and URL-state helpers that parse and write store, q, category, status, sort, dir, page, pageSize, plus tab for the detail page. Only non-default values go in the URL. Defaults: store all, sort updatedAt desc, page size 25 (25, 50, 100), tab overview. Sort cycle for a header: desc, then asc, then off (off removes sort and dir); one column at a time. Search uses replace, everything else push; changing any filter, search or store resets page to 1. Docs: docs/UI-NOTES.md (Products list), docs/DECISIONS.md section 3, docs/ARCHITECTURE.md (First render and TanStack Query).
```

**2.3 Tests: URL helpers** (Tester after)

```
Use skill test-after.
Step 2.3: tests for the URL-state helpers and query keys: defaults are omitted (store all, updatedAt desc, 25, overview), round trip, invalid values fall back to defaults, page resets on filter change, the sort cycle (desc, asc, off back to default), switching sort column starts at desc, tab round trip, the same params always give the same key.
```

**2.4 Products page and table** (Builder)

```
Use skill build-step.
Step 2.4: products page as a Server Component that prefetches with the same query key and hydrates (a failed prefetch is not dehydrated). Header per docs/SCREENS.md (title, subtitle, "Import CSV" for Managers). Table with the exact column order from docs/SCREENS.md, row heights 40 and 52, sortable headers with the up-down, up and down icons and aria-sort on the active th, SKU and numbers and money in the mono styles, Product cell with the supplier on a second line, Updated shown with formatWhen, pagination (Rows per page 25/50/100, range text, previous and next buttons), status badge with icon and text, 0 on hand in red plus the Out of stock badge. The whole row opens the product (keep ?store in the link; keyboard users get a link on the name); the checkbox column and the ··· menu must not navigate; the menu has one item, Adjust stock (renders but opens nothing yet). Row cards under 768px. Docs: docs/UI-NOTES.md (Products list), docs/SCREENS.md, docs/API.md.
```

**2.5 Filters, cards, states** (Builder)

```
Use skill build-step.
Step 2.5: debounced search (300 ms) and the category and status dropdowns with the exact placeholders; one chip per active filter plus the store chip (its x returns to All stores), "Clear all" keeps the store; the four summary cards with the exact titles, values and subtitles (display only for now; Low stock amber, Out of stock red). States with the exact copy in docs/SCREENS.md: loading keeps the header row, toolbar and pagination and shows skeleton rows only (aria-busy), cards show the dash placeholder; "No products yet" and "No products match these filters" (with Clear filters) as different states; error with the banner and the centered state, both "Try again" refetch only the list and keep old data visible and marked. Docs: docs/UI-NOTES.md (Products list), docs/SCREENS.md.
```

**2.6 Tests: list UI** (Tester after)

```
Use skill test-after.
Step 2.6: component tests for the products table: loading (header, toolbar and pagination stay, cards show the dash, aria-busy), no products yet and no results (different texts, Clear filters works), error with both Try again controls (old data kept), status badge shows text and not only colour, 0 on hand shows the Out of stock badge, sorting cycle updates the URL and aria-sort, chips and Clear all keep the store while the store chip's x clears it, page size options 25/50/100, clicking the row navigates but the checkbox and the menu do not. Use the exact texts from docs/SCREENS.md.
```

---

## Phase 3: Product detail and Adjust stock

**3.1 Detail page** (Builder)

```
Use skill build-step.
Step 3.1: product detail page (Server Component prefetch, same query key rules): breadcrumb, title with the status badge (follows the scope totals), meta line (SKU chip, category, supplier, unit cost), "Adjust stock" button (renders, opens nothing yet), keyboard-accessible underline tabs (Overview, Movements with count; arrow keys; active tab in ?tab=), details card with the exact rows from docs/SCREENS.md, stock-by-store table (only stores that carry the product, per-store status badge, Last movement with formatWhen, an Adjust button per row that opens nothing yet) and the amber "N of M stores need attention" text. Scoped by the store switcher. Docs: docs/UI-NOTES.md (Product detail), docs/SCREENS.md, docs/API.md.
```

**3.2 Chart** (Builder)

```
Use skill build-step.
Step 3.2: stock chart card on Overview with Recharts: title "On hand, last 30 days" (7d and 90d update it), subtitle, segmented 7d/30d/90d (default 30d, uses the days param), legend, daily closing on-hand for the scope and a dashed amber reference line at the summed reorder level. Only real points: one point is drawn as a dot with the caption from docs/DECISIONS.md section 1; zero points shows a small empty state. No tooltip yet. Docs: docs/UI-NOTES.md (Product detail), docs/SCREENS.md, docs/API.md (stock-history).
```

**3.3 Movements tab** (Builder)

```
Use skill build-step.
Step 3.3: Movements tab: filters "All types", "All stores", "Last 30 days" (period 7d/30d/90d), the columns from docs/SCREENS.md (Date & time newest first, Type pill with icon and color per type, Store with the arrow text for transfers, Change in red or green with a true minus sign, Balance, By with initials, Note), `128 movements` style count, pagination. "No movements yet" (with a Receive stock button that renders but opens nothing yet) and "No movements match these filters" (with Clear filters) are different states. Docs: docs/UI-NOTES.md, docs/SCREENS.md, docs/DECISIONS.md section 2.
```

**3.4 Adjust dialog UI** (Builder)

```
Use skill build-step.
Step 3.4: adjust stock dialog (reusable: props are product id, optional store id, opener ref). Segmented control (Receive, Sell, Write-off, Transfer) with the fields per type from docs/SCREENS.md (Sell: Store and Quantity; Receive: Store, Quantity, Note; Write-off: Store, Quantity, Reason; Transfer: From, To with a swap button, Quantity, Note). A store field first when the scope is All stores; only stores that carry the product are listed, shown as "Subang · 4 on hand". Client validation with the same Zod schema (on blur first, then live) and the exact error texts, the "After this change" preview with each store's new number and the status it will move to (use getStatus, status as icon and text), submit label that says exactly what happens ("Transfer 24 units", "unit" for 1), disabled while invalid or saving, saving state ("Saving...", spinner, fields disabled, close disabled until finished, values kept on error), footer "Signed in as <name> (<role>)", focus to the selected type on open, focus trap, Esc closes, focus returns to the opener. Use the Radix dialog from shadcn. No mutation wiring yet beyond a callback prop. Docs: docs/UI-NOTES.md (Adjust stock dialog), docs/SCREENS.md, docs/DECISIONS.md section 2 (saving state).
```

**3.5 Mutation and Staff locks** (Builder)

```
Use skill build-step.
Step 3.5: wire the dialog to a mutation with an Idempotency-Key (one key per payload, reused on retry, new after success or after editing). On success: toast (sonner, one at a time, bottom right, 5 s) with the exact texts from docs/SCREENS.md, close, and invalidate list, summary, detail, stock by store, movements and chart. On 409: show the server message in the dialog and refetch the numbers shown in the dialog. Open the dialog from the Adjust stock button on the detail page, from the Adjust buttons in the stock-by-store table, from the list row menu and from the Receive stock button of the empty Movements state. Staff: Write-off and Transfer show a lock icon, are locked with aria-disabled (not disabled), and have a keyboard-reachable tooltip "Only managers can write off or transfer stock". In Transfer, the "To" list excludes the "From" store. Docs: docs/UI-NOTES.md, docs/ARCHITECTURE.md (Writes and cache updates, Idempotency).
```

**3.6 Tests: detail and dialog** (Tester after)

```
Use skill test-after.
Step 3.6: component tests: fields per type (Sell has no note, Write-off has a required Reason, Transfer has From, To and Note), store field appears for All stores, only carried stores are listed, preview shows the new number and status (for example "Subang 4 → 2" with Low), button label says exactly what happens and reads "Transfer 24 units", write-off reason required, "Mont Kiara only has 18 on hand. Enter 18 or less." for a too high quantity, Staff sees locked types with aria-disabled and a keyboard-reachable tooltip, "To" excludes "From", submit disabled while saving, server INSUFFICIENT_STOCK error shows with the numbers refreshed and values kept, success shows the toast, Esc closes and focus returns to the opener, focus starts on the selected type, tabs work with the keyboard and ?tab=, movements empty states. Use exact texts from docs/SCREENS.md.
Phase end: also run `npm run check:full`.
```

**R2** Review, focus: dialog, cache invalidation, permission locks, a11y.

---

## Phase 4: Import

**4.1 Tests: row validation** (Tester first)

```
Use skill test-first.
Step 4.1: tests for validateImportRow in src/lib/domain/import-validation.ts (Contracts in docs/ARCHITECTURE.md, rules in docs/IMPORT.md, messages in docs/SCREENS.md).
<BRIEF: Validate everything on the server again, including every import row. On the review step, valid rows can be imported and rows with errors are skipped with a clear reason. An existing SKU updates the product and a new SKU creates one. Quantity is the new on-hand count at that store, not a change. Money is whole sen.>
Cover: one test per error code with the exact message (for example "Quantity can't be negative", "Unit cost isn't a number", "Unit cost is missing", "SKU is missing", "Category \"Snacks\" doesn't exist"), a row with two errors at once, existing SKU gives action update, new SKU gives create, a new SKU with an existing name still gives create, SKU trimmed and uppercased, header lookups through the mapping, cost "68.00" gives 6800, "RM 68" is accepted, "68.005" is rejected, a row whose context has duplicateOfRow 3 is invalid with "Same SKU as row 3" while the first row with that SKU is valid.
```

**4.2 Implement validation** (Builder)

```
Use skill build-step.
Step 4.2: implement validateImportRow so the existing tests pass. Docs: docs/IMPORT.md, docs/ARCHITECTURE.md Contracts.
```

**4.3 Tests: import routes** (Tester first)

```
Use skill test-first.
Step 4.3: route tests for POST /api/imports/validate and /api/imports/commit (docs/API.md, docs/IMPORT.md). Requests are multipart/form-data with file, storeId and mapping.
Cover: Staff gets 403 on both; validate saves nothing; the server parses the CSV itself (quoted fields, empty lines, BOM) and numbers rows from 1 without the header; duplicate SKUs: first row valid, later rows "Same SKU as row N"; file over 5 MB is 413 FILE_TOO_LARGE; a non-CSV or headerless file is 422 INVALID_FILE; more than 2000 rows is 422 IMPORT_TOO_LARGE; commit creates new products carried only at the chosen store with reorder level 0 and updates existing ones by SKU (a product not carried there starts being carried); quantity is the final count (movement type import with the difference and the file name as note, no movement when equal); invalid rows are skipped and reported; rows that became invalid since validate are skipped; commit twice with the same Idempotency-Key applies once.
```

**4.4 Import service, routes, sample file** (Builder)

```
Use skill build-step.
Step 4.4: import service and the validate and commit routes so the existing tests pass (server parses the CSV with papaparse, commit in one transaction). Add public/stockroom-import-template.csv (header row only) and samples/import-sample.csv: 50+ rows, header names different from Stockroom's ("Item code", "Description", "Group", "Qty", "Cost (RM)", plus extra "Barcode" and "Supplier" columns), a few existing SKUs, a few new ones, and broken rows covering at least six error kinds (negative quantity, non-numeric cost, duplicate SKU, unknown category, missing SKU, missing cost). Docs: docs/IMPORT.md, docs/API.md, docs/SCREENS.md.
```

**4.5 Upload and mapping UI** (Builder)

```
Use skill build-step.
Step 4.5: import page header, stepper and steps 1 and 2 with the exact copy from docs/SCREENS.md (the page is checked on the server; Staff are redirected, see 4.6). Step 1: dropzone for drag and drop or click (reject non-CSV and files over 5 MB in the browser with the message under it), the "Before you upload" card, "Download template (CSV)", "Import into store" select, Continue disabled until a file is chosen. The browser reads the header and a few rows with papaparse for the mapping step and for the error download (note the reason in README Tech stack). Step 2: file card with Replace file, amber banner for unmapped columns, mapping table with case-insensitive auto-match and aliases, `Matched`, `Set by you` and `Skipped` labels, "Don't import", one column per field, "All 5 required fields are mapped.", Continue to review enabled only when the 5 required fields are mapped. Docs: docs/UI-NOTES.md (Import), docs/IMPORT.md.
```

**4.6 Review, done, Staff screen** (Builder)

```
Use skill build-step.
Step 4.6: import steps 3 and 4. Review: send the file and mapping to the validate route; badges "114 ready" and "6 with errors" style, tabs All rows, Errors, Ready, the table with the exact columns and the first error message in Problem, status as icon and text, footer hint, "Download errors (CSV)" (original rows plus an error column with all messages, joined by row number), "Import N rows into <store>" (disabled at 0). Done: counts and links from docs/DECISIONS.md section 2. Staff opening /import are redirected to Products with ?notice=managers-only, and the products page shows a small dismissible message. Docs: docs/UI-NOTES.md (Import), docs/IMPORT.md, docs/DECISIONS.md, docs/SCREENS.md.
```

**4.7 Tests: import UI** (Tester after)

```
Use skill test-after.
Step 4.7: component tests: dropzone rejects non-CSV and files over 5 MB with the message under it, auto-match is case-insensitive (Item code, Description, Group, Qty, Cost (RM)) and shows "Set by you" after a change, Barcode and Supplier show as Skipped with the banner, Continue disabled until the 5 required fields are mapped, one field per column, review shows the first reason per row and the tabs filter rows, import button disabled at 0 valid rows, error download has the original columns plus an error column, Staff is redirected with the notice. Use exact texts from docs/SCREENS.md.
Phase end: also run `npm run check:full`.
```

---

## Phase 5: E2E and accessibility

**5.1 E2E Manager flow** (Tester after)

```
Use skill test-after.
Step 5.1: Playwright test in e2e/: a Manager filters the list, opens a product, transfers stock, and sees both stores' numbers change (detail and list). Reset the store before the test. Run `npm run e2e` once.
```

**5.2 E2E Staff locks** (Tester after)

```
Use skill test-after.
Step 5.2: Playwright test in e2e/: for Staff, Write-off and Transfer are locked, and a direct API call for a transfer returns 403. Reset the store before the test. Run `npm run e2e` once.
```

**5.3 Fixes and keyboard pass** (Builder)

```
Use skill build-step.
Step 5.3: fix only these app bugs found by the e2e tests: <list>. Then check by keyboard: tabs, segmented control, menus and the dialog. Check that nothing scrolls sideways at 375px except table containers.
```

**5.4 You:** confirm each suite runs with one command (`npm test`, `npm run e2e`).

---

## Phase 6: Deploy and README

**6.1 README from the code** (Builder)

```
Use skill build-step.
Step 6.1: fill every TODO(devin) section of README.md from the real code, with file names, tested from a clean clone. Do not touch the TODO(hanie) sections.
Phase end: also run `npm run check:full`.
```

**6.2 You:** write the TODO(hanie) sections (decisions from docs/DECISIONS.md, AI usage from docs/AI_LOG.md, what I cut, next, three changes). Final deploy, check the main flows on the live URL, re-read what you cannot explain.

**R3** Review the full range before sending.

**6.3 You:** send the email with the repo and Vercel links.

---

## Phase 7: Polish Pool (only if time is left)

**7.1** (Builder) `Step 7.1: make the Low stock and Out of stock cards set the status filter in the URL; a second click clears it. Products and Stock value stay not clickable. Docs: docs/UI-NOTES.md.`

**7.2** (Builder) `Step 7.2: row selection: checkbox per row and select all for the current page (indeterminate when some are selected), selection survives paging and keeps the selected rows' data, resets when the store, search or a filter changes; a toolbar replaces the normal one while rows are selected, with "{n} selected", "Export selected" (CSV built in the browser, no API call) and "Clear selection". Docs: docs/UI-NOTES.md, docs/DECISIONS.md section 3 (Selection).`

**7.3** (Builder) `Step 7.3: chart tooltip with date and value, on hover and on keyboard focus (the design requires both).`

**7.4** (Builder) `Step 7.4: mobile and tablet polish beyond usable: sticky SKU and Name columns at 768 to 1023px, filter sheet, 44px touch targets.`

**7.5** (Builder) `Step 7.5: the "synced N min ago" text under the title, from the list query's last update time.`

**7.6** (Tester after) `Step 7.6: tests for 7.1 and 7.2.`
