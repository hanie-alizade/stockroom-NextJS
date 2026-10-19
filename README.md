# Stockroom

Stock app for Kopi Lane, a café chain with six stores. Take-home project for Radii (Frontend Engineer, Round 2).
It is a Next.js App Router app with a real backend inside it: Route Handlers, in-memory data seeded from JSON, permissions and validation on the server.

- **Live:** https://stockroom-vert-one.vercel.app
- **Docs:** [docs/](docs/) (see the index at the bottom)

## Try it in two minutes

There is no real login. The current user is a cookie, and the **first visit is Faiz Hakim (Staff)** on purpose: the server falls back to the least privileged user. Use **Switch** in the sidebar and choose **Aina Rahman (Manager)** to see everything.

1. **List.** Change the store in the sidebar (every number on the page changes), search, filter, sort, change the page size. Copy the URL into a new tab: you get the same view. Click the **Low stock** card to filter by it. Select a few rows and use **Export selected**.
2. **Detail.** Open **Arabica beans 1 kg** (`KL-1042`): 30-day chart (7d, 30d, 90d), details card, stock by store, and the **Movements** tab with filters.
3. **Adjust stock** (as Manager). Choose **Transfer**, Mont Kiara to Subang, 5 units. The dialog closes, a toast appears and the numbers change in the detail page, the movements, the list and the cards, with no reload. Try 999 units to see the `INSUFFICIENT_STOCK` message.
4. **As Staff.** **Write-off** and **Transfer** are visible but locked (lock icon, tooltip). `/import` redirects to Products with a message.
5. **Import** (as Manager). Upload [`samples/import-sample.csv`](samples/import-sample.csv) (63 rows) into Mont Kiara. The columns are matched by name, the review shows 55 valid and 8 invalid rows, the broken rows can be downloaded as CSV, and the valid rows are imported.
6. **States.** Add `?fail=1` to a page URL (for example `/products?fail=1`) to see the error states. Every API route waits about 500 ms, so the loading states are visible.

## Quick start

```bash
nvm use            # Node 22, from .nvmrc
npm install
npm run dev        # http://localhost:3000
```

### Environment variables

All optional. `.env.example` lists them.

| Variable               | Default | What it does                                                                                              |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `SIMULATED_LATENCY_MS` | `500`   | Delay added to every API route. Playwright sets it to `0`.                                                |
| `E2E`                  | unset   | `1` allows `POST /api/test/reset` in a production build (Playwright only). Never set it on the live site. |

`NODE_ENV` is set by Next.js and Vitest, and it changes three things: `POST /api/test/reset` works only in `development` or with `E2E=1` (otherwise 404); the seed movement dates are rebased to today except in `test`, so unit tests do not depend on the date; the session cookie is `Secure` in `production`.

## Scripts

| Command                 | What it does                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run dev`           | Dev server                                                               |
| `npm test`              | Vitest: domain, helpers, hooks, services, route handlers (one run)       |
| `npm test -- <path>`    | One test file                                                            |
| `npm run e2e`           | Playwright: builds the app, starts it with `E2E=1`, runs `e2e/*.spec.ts` |
| `npm run check`         | Typecheck, ESLint, repo rules script and `npm test` (no e2e)             |
| `npm run check:full`    | `check` plus the production build                                        |
| `npm run build`         | Production build                                                         |
| `npm run sample:import` | Regenerates `samples/import-sample.csv` from the seed                    |

## Tests

Each suite runs with one command and exits by itself.

```bash
npm test                              # about 300 tests in 33 files
npx playwright install chromium       # once per machine
npm run e2e                           # port 3000 must be free: stop `npm run dev` first
```

What the brief asked for, and where it lives:

| Brief requirement                                                                    | Where                                                                                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Unit tests: status                                                                   | `src/domain/__tests__/status.test.ts` (reorder level 0 is never Low, boundaries, summed values)                              |
| Unit tests: cannot go below zero, transfer totals                                    | `src/domain/__tests__/stockRules.test.ts` (exact stock is allowed, the two transfer movements add up to 0)                   |
| Route tests: Staff gets 403 for write-off, transfer; oversell returns the error code | `src/app/api/products/[id]/adjustments/__tests__/route.test.ts` (`FORBIDDEN`, `INSUFFICIENT_STOCK`, replay, key reuse)       |
| Route tests: Staff gets 403 for import                                               | `src/app/api/imports/__tests__/route.test.ts` (validate and commit)                                                          |
| CSV row validation, at least five kinds of problem                                   | `src/domain/__tests__/importValidation.test.ts` (seven error codes), plus the sample file counts in `importsService.test.ts` |
| Playwright: Manager filters, opens a product, transfers, both stores change          | `e2e/managerTransfer.spec.ts`                                                                                                |
| Playwright: Write-off and Transfer locked for Staff                                  | `e2e/staffLocked.spec.ts`                                                                                                    |

Beyond the brief: idempotent replay and key reuse, transfer and import rollback, seed integrity (movements add up to the stock), `withApi` (delay, `?fail=1`, permission), session cookie, date formatting in a fixed time zone, money parsing without floats. Details, fixtures and the test seams are in [docs/TESTING.md](docs/TESTING.md).

## Tech stack

Next.js 16 (App Router), React 19, TypeScript (strict, no `any`), Tailwind 4, shadcn/ui, TanStack Query, Zod, Recharts, Vitest + React Testing Library, Playwright. Deployed on Vercel.

Extra libraries and why:

| Library                                                          | Why                                                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `papaparse`                                                      | CSV parsing. The browser reads headers and sample rows for the mapping step; the server parses the real file.                               |
| `axios`                                                          | One HTTP client with a response interceptor that turns every failure into the same `ApiError` (code, status, field errors, network errors). |
| `sonner`                                                         | Toasts after a mutation (one at a time, as the design asks).                                                                                |
| `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` | The parts under shadcn/ui (dialog, select, tabs, tooltip) and the `cn()` helper.                                                            |

### Design tokens

The Figma variables are CSS custom properties in `src/app/globals.css`. Primitives (stone, green, sage, amber, red, blue, violet) are not exposed to Tailwind. Only semantic tokens are (`bg-bg-canvas`, `text-text-primary`, `bg-accent-default`, `bg-status-warn-bg`, and so on), and the Figma text styles are utilities (`text-page-title`, `text-body`, `text-mono`). Hex values exist only in `globals.css`; `scripts/check-rules.mjs` fails the check if one appears anywhere else.

## How it works

### How the first page of data gets from the server into TanStack Query

The list and the detail page are Server Components. They read the search params, create a `QueryClient` and call `prefetchQuery` with the **same query key** and the **same service function** the API route uses, so there is no HTTP request from the server to itself. They then render the client component inside `<HydrationBoundary state={dehydrate(queryClient)}>`. The client component (`ProductsView`, `ProductDetailView`) calls `useQuery` with the same key, so it renders instantly from the hydrated cache and refetches by the normal rules afterwards. `layout.tsx` does the same for `meta` (stores, categories, users), so the sidebar is filled on the first paint.

Two details that matter: query keys are built only in `src/constants/queryKeys.ts` from the normalised URL params, so the server and the client cannot disagree; and if the prefetch fails (for example with `?fail=1`) the failed query is not dehydrated, so the client fetches on its own and shows the real error state with a retry button instead of pretending the data is empty.

### Where permissions are checked, and why in both places

On the server, which is the only real enforcement:

- Import routes use `withApi(request, handler, { permission: PERMISSION.IMPORT })`, so Staff get 403 `FORBIDDEN` before the handler runs. The `/import` page also checks the permission before it renders and redirects Staff.
- Adjustments check `ADJUSTMENT_PERMISSION[type]` inside `createAdjustment`, because the permission depends on the body (Receive and Sell for everyone, Write-off and Transfer for Managers).
- The role is never sent by the client. The cookie holds only a user id and the server looks the role up in its own user list. An unknown or missing cookie means Staff.

In the UI, the same `roleHasPermission()` function (through `useCan()` and `PermissionGate`) only **locks** things: Write-off and Transfer stay visible with a lock icon and a tooltip, and the Import link is hidden. A locked control with an explanation is better than a hidden one, and Staff should see what exists. The UI can be bypassed with devtools or curl, so it is never trusted. Both sides use one policy table, so they cannot disagree.

### How a double adjustment is stopped

Two layers.

- **Client** (`useIdempotencyKey`): one UUID per payload. The submit button is disabled while the request runs, so one click is one request. A retry of the same payload after an unclear outcome (network error, timeout, 5xx) reuses the key. The key is replaced after a success, after a clear server answer (4xx such as 409 or 422), or when the person edits the form.
- **Server**: `Idempotency-Key` is required. The repository stores `key -> { requestHash, status, body }`, where the hash is SHA-256 of the canonical JSON (sorted keys) of the product id and the body. The lookup and the write happen in one synchronous transaction with no `await` between them, so two parallel requests with the same key cannot both apply. The same key with the same payload returns the stored result with status 201 and the header `Idempotent-Replay: true`. The same key with a different payload returns 422 `IDEMPOTENCY_KEY_REUSED`. The import commit works the same way.

### How the transfer's two movements stay consistent

- `planTransfer` is a pure function. It rejects the same store and a source without enough stock, and returns two movement drafts, `transfer_out` and `transfer_in`, with the same `transferId`. Its invariant is that the signed quantities add up to 0.
- `applyTransfer` runs inside `repo.transaction(fn)`. It checks that both stores carry the product and that the source has enough stock, then writes both stock rows, both movements and the idempotency record.
- The in-memory transaction runs synchronously (no `await` inside), so no other request can interleave in single-threaded JavaScript. `TransactionManager` snapshots every row the first time it is touched. If anything throws, it restores all of them, so the result is both movements or neither.
- Tests cover both sides: the total stock across stores is unchanged by a transfer, and a failure in the middle (the destination does not carry the product) leaves both stores untouched.

### API errors

One error shape everywhere: `{ "error": "INSUFFICIENT_STOCK", "message": "...", "fieldErrors": [] }`. The frontend branches on `error` only. Codes and status codes are in [docs/API.md](docs/API.md). Zod errors are mapped to field codes in one place (`withApi`), and platform errors that never reach a handler (for example HTTP 413 from the host) are normalised in the browser client.

### Call the API without the UI

The cookie decides the role: `aina-rahman` is Manager, `faiz-hakim` and `mei-ling` are Staff.

```bash
BASE=https://stockroom-vert-one.vercel.app

# Staff write-off: 403 FORBIDDEN
curl -i -X POST $BASE/api/products/KL-1042/adjustments \
  -H "Content-Type: application/json" -H "Idempotency-Key: $(uuidgen)" -H "Cookie: stockroom_user=faiz-hakim" \
  -d '{"type":"write_off","storeId":"mont-kiara","quantity":1,"note":"Expired"}'

# Manager oversell: 409 INSUFFICIENT_STOCK
curl -i -X POST $BASE/api/products/KL-1042/adjustments \
  -H "Content-Type: application/json" -H "Idempotency-Key: $(uuidgen)" -H "Cookie: stockroom_user=aina-rahman" \
  -d '{"type":"sell","storeId":"mont-kiara","quantity":999}'

# Same key twice: the second answer has the header Idempotent-Replay: true and nothing is applied twice
KEY=$(uuidgen)
for i in 1 2; do curl -i -X POST $BASE/api/products/KL-1042/adjustments \
  -H "Content-Type: application/json" -H "Idempotency-Key: $KEY" -H "Cookie: stockroom_user=aina-rahman" \
  -d '{"type":"receive","storeId":"mont-kiara","quantity":1}'; done

# Forced failure: 500 INTERNAL_ERROR
curl -i "$BASE/api/products?fail=1"
```

### Import

A four-step wizard (Upload, Map columns, Review, Done), Manager only. The browser parses only the header and a few rows, to match the columns by name and to build the error download. **The server parses and validates every row again and decides**, both on `validate` and on `commit`, because the data can change between the two. An existing SKU updates the product, a new SKU creates it, and the quantity is the new on-hand count at the chosen store (the server writes one `import` movement for the difference). Valid rows are applied in one transaction, invalid rows are skipped with a reason, and commit is idempotent. Limits: 5 MB, 2,000 rows. Full rules are in [docs/IMPORT.md](docs/IMPORT.md).

### Seed data

`scripts/generate-seed.ts` writes `data/seed.json` with a seeded random generator, so the data is the same on every run: 248 products, 6 stores, 6 categories, 7 suppliers, 3 users and about 8,500 movements over roughly 90 days. A product is carried only at some stores (Mont Kiara 212, Subang 191, Cheras 168, Damansara 162, Puchong 147, Shah Alam 147). Movements add up to the current stock, so the chart and the numbers agree. Money is stored as whole sen (RM 68.00 is `6800`).

## Deploy and production limits

Deployed on Vercel from `main`. No environment variable is needed (the delay defaults to 500 ms, and `E2E` must stay unset). Things to know about the live site:

- **In-memory data.** Each serverless instance has its own memory and instances are recycled, so data resets after a period of inactivity, and two requests can in principle land on different instances. This is fine for a demo and is what the brief allows. A real version needs a database.
- **Reset route.** `POST /api/test/reset` answers 404 in production.
- **Upload size.** Vercel limits a function request body to about 4.5 MB, so a CSV close to 5 MB gets a platform 413 before it reaches the route. The browser client maps it to the same `FILE_TOO_LARGE` message. The sample file is a few KB.
- **Session cookie.** The demo cookie is not signed. It is `httpOnly`, `sameSite=lax` and `Secure` in production, and it holds only a user id, so a client still cannot claim a role.

## Decisions for the parts that were not designed

- **Below 1024px.** From 1024px the sidebar is fixed. Below it, a top bar with a menu button opens the sidebar as a slide-in sheet. The products table is used from 768px, with the first columns sticky and horizontal scroll inside its own container. Below 768px (down to 375px) each product becomes a card, and the filters move into a bottom sheet that applies changes straight to the URL. The detail page stacks into one column, and its tables scroll with the first column sticky. The adjust dialog stays a dialog (never wider or taller than the viewport minus 32 px); under 640px From and To stack and the footer buttons stack. Why: a table is still the best format when it fits, cards avoid sideways scrolling on a phone, and breakpoints in CSS avoid layout shifts.
- **Last step of the import (Done).** All four steps show a check. A header block says "Import complete" (or "Nothing was imported" with an amber icon when every row was skipped), followed by four stat cards (Created, Updated, Unchanged, Skipped) taken straight from the commit response. If rows were skipped, a banner offers "Download skipped rows (CSV)". Two actions: "View products in <Store>" and "Import another file". The result is announced in a live region.
- **A product with no movements.** The Movements tab has its own empty state, "No movements yet", with a "Receive stock" button that opens the dialog. It is different from "No movements match these filters", which offers "Clear filters". The list has the same two kinds: "No products yet" and "No products match these filters".
- **What Staff see on /import.** The link is hidden in the sidebar. If they open the URL anyway, the server redirects them to Products with `?notice=managers-only`, and the list shows a small dismissible message "Import is available to managers only", so they understand why. This follows the design note and needs less code than a separate screen. The API returns 403 as well.
- **Saving state in the dialog.** While the request runs the button shows a spinner and "Saving...", the fields are disabled and the dialog cannot be closed, so nobody loses the result. On an error the dialog stays open, keeps the typed values and shows the server message. On success a toast appears, the dialog closes and focus goes back to the button that opened it.
- **Product not carried at the chosen store.** The detail page shows "This product is not carried at <Store>" with a "View in all stores" action instead of zeros that look like "out of stock".
- **Summary cards ignore search and filters.** They follow the store scope only. Otherwise clicking "Low stock" would change the very number you clicked.

More small decisions (selection, URL state, dates and time zone, supplier is `null` for imported products, product id is the SKU) are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Answers to the "Open questions" in the Handoff notes

- **Is reorder level 0 ever Low?** No. Low means more than 0 and at or below the reorder level, and no number is both. Stock 0 is Out, and any positive stock is In stock. A reorder level of 0 means "never reorder", so there is nothing to warn about. With "All stores" the sums are used, so a product can still be Low overall.
- **Transfer to the same store.** Prevented in two places. The UI removes the From store from the To list (and clears To if From changes into it). The server rejects it with 422 `VALIDATION_ERROR` and a `SAME_STORE` field error, because the UI alone is not enough.
- **Sorting by Status.** Most urgent first: Out, Low, In stock when descending (the first click), reversed when ascending, ties by SKU so pages are stable. Alphabetical order would put "In stock" first, which is useless when you are scanning for problems.
- **Chart with one point.** Drawn honestly as a visible dot with the caption "Only 1 data point so far", not as a line that implies a trend. No fake history. With zero points the chart shows a small empty state.

## Accessibility

The dialog traps focus, closes on Esc and returns focus to the button that opened it (Radix Dialog; focus first goes to the selected type). Tabs, the segmented control, selects and menus work with the keyboard. Locked options use `aria-disabled` instead of `disabled`, so the tooltip also opens on keyboard focus. Status is always an icon plus text plus colour. Tables have `aria-sort` and `aria-busy`, results use `aria-live`, and every input has a label. The app is usable at 375 px (mobile header, product cards, filter sheet).

## AI usage

I used AI every day, in three ways.

- **Devin (desktop coding agent) wrote most of the first code.** I gave it one small prompt at a time, with a feature checklist and a list of the docs it may read. `AGENTS.md` is its rulebook: it may not commit, push or touch the git history, and it ends with a short checklist. I reviewed every diff and made every commit myself. For the backend I did TDD: failing tests first (status, money, policy, dates, stock rules), then the code. For the UI I wrote tests after.
- **Claude (chat) for planning and review.** I used it to turn the Figma screenshots into pixel measurements for the prompts (the detail page and the adjust dialog), to write those prompts, to review the whole project against the brief, and to rewrite the docs when the plan changed. It also drafted this README from my docs, and I checked each claim against the code.
- **What I changed or threw away:**
  - The first plan (seven phases) and then a reduced nine-step plan. I dropped both because the cut items (import UI, selection and export, clickable cards) ended up built together with the screens they belong to. The docs now describe what really exists.
  - The first folder layout lived under `src/lib`. I moved domain, helpers and server code to the top level, consolidated constants, types and schemas, and renamed components to PascalCase, so imports go through barrels and the rules are simpler to explain.
  - My early prompts told the agent not to match Figma pixels ("UI-lite"). The result did not look like the design, so for the detail page and the dialog I measured the screenshots and gave exact sizes.
  - The first version of the stock-history endpoint returned the same number for every day, which draws a flat line. I caught it when comparing the chart with Figma and rebuilt it from the movements, walking backwards from today's stock.
  - An AI-written paragraph named the replay header `Idempotency-Replayed`. The code and the API use `Idempotent-Replay`. I fixed the text, and the docs now follow the code.
- **How I made sure I can explain it:** I read every diff before committing, and `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` are my walkthrough notes. I can follow one transfer from end to end: the dialog, `useMutationAdjustment`, the route, `withApi`, `createAdjustment`, `applyTransfer` and `TransactionManager`.

## What I cut

Nothing from priority 1 or 2 of the brief. These are the gaps that remain, and why:

- **The row actions button (`···`) in the products table** renders but opens no menu. The design has one item ("Adjust stock"), and the detail page already covers it, so I left it unwired rather than ship a half-done menu. The `···` button next to "Adjust stock" on the detail page is not built because the design defines no items for it.
- **Permission before validation on adjustments.** The body is validated before the permission is checked, so a Staff request with an invalid write-off body (for example no reason) gets 422 instead of 403. A valid Staff write-off or transfer gets 403 as the brief asks. The fix is known: read only `type` first, check the permission, then validate the rest.
- **React component tests.** There are no React Testing Library tests for components. Domain, helpers, hooks, services, routes and two end-to-end journeys are covered.
- **Keyboard focus on the chart.** The tooltip works on hover. I did not verify keyboard focus on the chart.
- **Browsers.** Playwright runs Chromium only.
- **Real login, Suppliers and Reports.** The design marks Suppliers and Reports as "Soon", so they are disabled. Login is replaced by the user switcher, as the brief allows.

## What I would do next

1. Close the permission-before-validation gap and add a route test for it.
2. Wire the row actions menu to "Adjust stock", so a product can be adjusted from the list.
3. Add React Testing Library tests, starting with the validation messages of the adjust dialog.
4. Check the chart with the keyboard, and walk through every screen again at 375 px.
5. Move `useDebouncedCallback` from `src/lib/client` to `src/hooks` (the only file that breaks the folder rules).

## Three things I would change in a second version

1. **A real database behind the repository interface.** The interface describes the contract, but a database has to provide the guarantees: a transaction for transfers, a unique constraint for idempotency keys, and constraints or locking so stock cannot go below zero under concurrency. Idempotency keys would be scoped per user and expire.
2. **Real sessions and a permission check before validation.** A signed session instead of a bare user-id cookie, and one authorization step in `withApi` for every write, so the order of checks (permission, then validation) is the same everywhere and not decided inside each service.
3. **More automated checks in CI.** Run `check` and the Playwright suite on every push, add component tests and an accessibility scan (axe) to the end-to-end run. Today the rules are enforced by hooks on my machine.

## Docs

| File                                         | What is in it                                                  |
| -------------------------------------------- | -------------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                       | Rules for coding agents: scope, hard rules, git, final message |
| [docs/PLAN.md](docs/PLAN.md)                 | Phases that were followed, status, what is left                |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, folder layout, data flow, transactions, contracts      |
| [docs/API.md](docs/API.md)                   | Routes, error codes, headers, idempotency                      |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md)   | Naming, structure, TypeScript, React, tests, commits           |
| [docs/DECISIONS.md](docs/DECISIONS.md)       | Answers to the open questions, undesigned parts, known gaps    |
| [docs/UI-NOTES.md](docs/UI-NOTES.md)         | UI behaviour from the Figma annotations, as built              |
| [docs/SCREENS.md](docs/SCREENS.md)           | Exact copy, names and formats                                  |
| [docs/IMPORT.md](docs/IMPORT.md)             | Import rules, wizard and commit                                |
| [docs/TESTING.md](docs/TESTING.md)           | Test layers, seams, fixtures, coverage against the brief       |
