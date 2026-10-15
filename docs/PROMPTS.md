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
Step 0.2: ESLint flat config (type-aware) with these as errors: @typescript-eslint/no-explicit-any, no-non-null-assertion, consistent-type-imports, consistent-type-assertions {assertionStyle: "never"} (so only `as const`), explicit-module-boundary-types, no-floating-promises; no-restricted-syntax for TSEnumDeclaration; ban default exports except Next files (page, layout, loading, error, not-found) and config files; no-restricted-imports for "../../*"; no-console; eqeqeq; no-nested-ternary; react-hooks rules; max-lines 250 as a warning; import order.
Prettier is configured in .prettierrc.json (tailwind plugin). Install husky and lint-staged, add "prepare": "husky". Do NOT run `husky init`: .husky/pre-commit, .husky/pre-push and .lintstagedrc.json already exist, keep them.
Docs: docs/CONVENTIONS.md.
```

**0.3 Test tooling** (Builder)
```
Use skill build-step.
Step 0.3: Vitest + React Testing Library + jsdom with the `@/` alias, a setup file, and an empty tests/builders.ts. Playwright config: chromium only, retries 0, workers 1, forbidOnly, reporter "line", webServer runs `npm run build && npm run start` with E2E=1 on a free port. Do not write any test files. Update the Commands table in AGENTS.md and the Scripts and Tests sections of README.md.
```

**0.4 Theme tokens** (Builder)
```
Use skill build-step.
Step 0.4: map the Figma variables to CSS variables in src/app/globals.css and to the Tailwind theme (colors, radius, spacing, fonts, text styles). Variables: <paste Figma variables, or write "use placeholders and mark each with TODO(hanie)">.
```

**0.5 You:** connect the repo to Vercel and deploy the placeholder.

---

## Phase 1: Domain rules and API

Brief rules to paste into the test-first prompts below are marked `<BRIEF: ...>`.

**1.1 Seed data** (Builder)
```
Use skill build-step.
Step 1.1: write scripts/generate-seed.ts (seeded PRNG, deterministic) and generate data/seed.json: about 250 products, 6 stores, stock and reorder level per store, 30+ days of movements per product that add up to the current stock. Must include on purpose: out of stock, low stock, reorder level 0, a product with no movements, a product with one history point, two long names. Money in sen. Docs: docs/ARCHITECTURE.md (Seed data), docs/API.md (movement shape).
```

**1.2 Tests: status, money, policy** (Tester first)
```
Use skill test-first.
Step 1.2: tests for src/lib/domain/status.ts, money.ts, policy.ts (Contracts in docs/ARCHITECTURE.md).
<BRIEF: Status is calculated. Out of stock = 0. Low = more than 0 and at or below the reorder level. Everything else is In stock. For "All stores", on hand and reorder level are summed first. Money is whole sen (6800 shown as 68.00 in tables, RM 68.00 in sentences). Staff: view, receive, sell. Manager: everything.>
Edge cases: docs/DECISIONS.md section 1 (reorder level 0).
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
Cover: missing or invalid role cookie means staff, 403 FORBIDDEN shape, ?fail=1 returns 500 INTERNAL_ERROR and does not run the handler, AppError and ZodError map to the standard shape, invalid JSON gives 400 INVALID_JSON. Docs: docs/API.md (Session, Error format, Codes).
```

**1.8 Implement withApi and small routes** (Builder)
```
Use skill build-step.
Step 1.8: implement withApi and the routes /api/session (POST), /api/meta (GET), /api/test/reset (POST, only in dev or E2E=1). Make the existing tests pass. Docs: docs/API.md, docs/ARCHITECTURE.md (Request wrapper).
```

**1.9 Read routes** (Builder)
```
Use skill build-step.
Step 1.9: services and routes for GET /api/products (store scope, search, category, status, sort, dir, page, pageSize, summary), GET /api/products/:id, GET /api/products/:id/movements, GET /api/products/:id/stock-history. Docs: docs/API.md, docs/DECISIONS.md (status sort order, summary cards, search).
```

**1.10 Tests: read routes** (Tester after)
```
Use skill test-after.
Step 1.10: route tests for the four read routes.
Cover: All stores sums on hand and reorder level and derives status from the sums; store scope; search by name and SKU; category and status filters; status sort order (out, low, in stock, ties by SKU); paging and total; summary ignores filters; unknown product 404 PRODUCT_NOT_FOUND; stock-history returns one point for the one-point product and none invented; movements filters and order. Docs: docs/API.md, docs/DECISIONS.md.
```

**1.11 Tests: adjustments** (Tester first)
```
Use skill test-first.
Step 1.11: route tests for POST /api/products/:id/adjustments and createAdjustment (docs/API.md).
<BRIEF: Staff can receive and sell; managers can also write off, transfer and import. A Staff request for a write-off, a transfer or an import must get a 403. Overselling returns your error code. A write-off needs a reason. A transfer creates two movements, one out and one in; both are saved or neither is. A double click or a retry on a slow connection must never apply the same change twice (Idempotency-Key header).>
Cover: Staff gets 403 for write_off and transfer, and still can receive and sell; oversell returns 409 INSUFFICIENT_STOCK and changes nothing; write-off without reason is 422; same-store transfer is 422; same key and same payload twice applies once and returns the same response with Idempotent-Replay; same key with another payload is 422 IDEMPOTENCY_KEY_REUSED; missing key is 400; transfer creates exactly two movements with one transferId and total stock is unchanged; ?fail=1 changes nothing. Reset the store in beforeEach.
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
Step 2.1: app layout: fixed 248px sidebar, store switcher (All stores plus 6 stores), user switcher (Manager or Staff, posts to /api/session then refreshes), mobile menu below 1024px (slide-in sidebar with the same switchers). Staff must not see the Import link. Docs: docs/DECISIONS.md section 2 (below 1024px).
```

**2.2 Query layer and URL state** (Builder)
```
Use skill build-step.
Step 2.2: src/lib/client/query-keys.ts, a typed API client, and URL-state helpers that parse and write store, q, category, status, sort, dir, page, pageSize (only non-default values in the URL; search uses replace, everything else push; changing any filter resets page to 1). Docs: docs/DECISIONS.md section 3 (URL state, defaults), docs/ARCHITECTURE.md (First render and TanStack Query).
```

**2.3 Tests: URL helpers** (Tester after)
```
Use skill test-after.
Step 2.3: tests for the URL-state helpers and query keys: defaults are omitted, round trip, invalid values fall back to defaults, page resets on filter change, the same params always give the same key.
```

**2.4 Products page and table** (Builder)
```
Use skill build-step.
Step 2.4: products page as a Server Component that prefetches with the same query key and hydrates (a failed prefetch is not dehydrated). Table with sortable columns, pagination and page size, status badge with icon and text, row cards under 768px. Docs: docs/ARCHITECTURE.md, docs/API.md (GET /api/products).
```

**2.5 Filters, cards, states** (Builder)
```
Use skill build-step.
Step 2.5: debounced search, category and status filters, summary cards (display only), loading skeleton, "No products yet" and "No results for these filters" (with Clear filters) as different messages, error state with Retry that keeps old data visible and marked. Docs: docs/DECISIONS.md section 3.
```

**2.6 Tests: list UI** (Tester after)
```
Use skill test-after.
Step 2.6: component tests for the products table: loading, no products yet, no results (different text, Clear filters works), error with Retry (old data kept), status badge shows text and not only colour, sorting and pagination change the URL.
```

---

## Phase 3: Product detail and Adjust stock

**3.1 Detail page** (Builder)
```
Use skill build-step.
Step 3.1: product detail page (Server Component prefetch, same query key rules), keyboard-accessible tabs (Overview, Movements), details card, stock-by-store table with status badges, scoped by the store switcher. Docs: docs/API.md.
```

**3.2 Chart** (Builder)
```
Use skill build-step.
Step 3.2: 30-day stock chart on Overview with Recharts. Only real points: one point is drawn as a dot with the caption from docs/DECISIONS.md section 1; zero points shows a small empty state. No tooltip yet.
```

**3.3 Movements tab** (Builder)
```
Use skill build-step.
Step 3.3: Movements tab: type and date filters, pagination, newest first. "No movements yet" (with a Receive stock button) and "No results for these filters" (with Clear filters) are different states. Docs: docs/DECISIONS.md section 2, docs/API.md.
```

**3.4 Adjust dialog UI** (Builder)
```
Use skill build-step.
Step 3.4: adjust stock dialog: segmented control (Receive, Sell, Write-off, Transfer), form per type, client validation with the same Zod schema, field and server errors, saving state (spinner, fields disabled, close disabled until finished, values kept on error, "Try again"), focus trap, Esc closes, focus returns to the opening button. Use the Radix dialog from shadcn. No mutation wiring yet beyond a callback prop. Docs: docs/DECISIONS.md section 2 (saving state).
```

**3.5 Mutation and Staff locks** (Builder)
```
Use skill build-step.
Step 3.5: wire the dialog to a mutation with an Idempotency-Key (one key per payload, reused on retry, new after success or after editing), invalidate list, summary, detail, stock by store, movements and chart. Staff: Write-off and Transfer are locked with a short explanation (not just disabled). In Transfer, the "To" list excludes the "From" store. Docs: docs/ARCHITECTURE.md (Writes and cache updates, Idempotency).
```

**3.6 Tests: detail and dialog** (Tester after)
```
Use skill test-after.
Step 3.6: component tests: dialog validation per type (quantity rules, write-off reason), Staff sees locked types, "To" excludes "From", submit button disabled while saving, server INSUFFICIENT_STOCK error shows and keeps values, Esc closes and focus returns to the trigger, tabs work with the keyboard, movements empty states.
Phase end: also run `npm run check:full`.
```

**R2** Review, focus: dialog, cache invalidation, permission locks, a11y.

---

## Phase 4: Import

**4.1 Tests: row validation** (Tester first)
```
Use skill test-first.
Step 4.1: tests for validateImportRow in src/lib/domain/import-validation.ts (Contracts in docs/ARCHITECTURE.md, rules in docs/IMPORT.md).
<BRIEF: Validate everything on the server again, including every import row. On the review step, valid rows can be imported and rows with errors are skipped with a clear reason. An existing SKU updates the product and a new SKU creates one. Quantity is the new on-hand count at that store, not a change. Money is whole sen.>
Cover: one test per error code, a row with two errors at once, existing SKU gives action update, new SKU gives create, a new SKU with an existing name still gives create, SKU trimmed and uppercased, cost "68.00" gives 6800, "RM 68" is accepted, "68.005" is rejected, duplicate SKU rows are all invalid with the row numbers in the message.
```

**4.2 Implement validation** (Builder)
```
Use skill build-step.
Step 4.2: implement validateImportRow so the existing tests pass. Docs: docs/IMPORT.md, docs/ARCHITECTURE.md Contracts.
```

**4.3 Tests: import routes** (Tester first)
```
Use skill test-first.
Step 4.3: route tests for POST /api/imports/validate and /api/imports/commit (docs/API.md, docs/IMPORT.md).
Cover: Staff gets 403 on both; validate saves nothing; commit creates new products and updates existing ones by SKU; quantity is the final count (movement type import with the difference, no movement when equal); invalid rows are skipped and reported; rows that became invalid since validate are skipped; commit twice with the same Idempotency-Key applies once; more than the row limit gives 422 IMPORT_TOO_LARGE.
```

**4.4 Import service, routes, sample file** (Builder)
```
Use skill build-step.
Step 4.4: import service and the validate and commit routes so the existing tests pass (commit in one transaction). Add samples/import-sample.csv: 50+ rows, header names different from Stockroom's (for example "Item code", "Description", "Group", "Qty", "Cost (RM)"), a few existing SKUs, a few new ones, and broken rows covering at least five error kinds. Docs: docs/IMPORT.md, docs/API.md.
```

**4.5 Upload and mapping UI** (Builder)
```
Use skill build-step.
Step 4.5: import page steps 1 and 2 (the page is checked on the server). Step 1: choose a store, choose a CSV (parsed in the browser with papaparse; note the reason in README Tech stack). Step 2: column mapping with auto-match by normalised header and aliases, `Matched` and `Set by you` labels, "Don't import", one column per field, Continue enabled only when all required fields are mapped. Docs: docs/IMPORT.md.
```

**4.6 Review, done, Staff screen** (Builder)
```
Use skill build-step.
Step 4.6: import steps 3 and 4. Review: summary counts, rows with status (icon and text) and reasons, "Import N valid rows" (disabled at 0), "Download broken rows" CSV with an extra error column. Done: counts and links from docs/DECISIONS.md section 2. Staff opening /import see the "Managers only" screen. Docs: docs/IMPORT.md, docs/DECISIONS.md.
```

**4.7 Tests: import UI** (Tester after)
```
Use skill test-after.
Step 4.7: component tests: auto-match and "Set by you", Continue disabled until required fields are mapped, one field per column, review shows reasons, import button disabled at 0 valid rows, Staff sees the Managers only screen.
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

**7.1** (Builder) `Step 7.1: make the Low stock and Out of stock cards set the status filter in the URL. Pressing the active card clears it.`

**7.2** (Builder) `Step 7.2: row selection (current page only, cleared when store, search or filters change) and export of selected rows to CSV in the browser. Docs: docs/DECISIONS.md section 3 (Selection).`

**7.3** (Builder) `Step 7.3: chart tooltip with date and value, reachable by keyboard if cheap.`

**7.4** (Builder) `Step 7.4: mobile and tablet polish beyond usable: sticky SKU and Name columns at 768 to 1023px, filter sheet, 44px touch targets.`

**7.5** (Tester after) `Step 7.5: tests for 7.1 and 7.2.`
