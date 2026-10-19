# Stockroom

Stock app for Kopi Lane, a cafe chain with six stores. Take-home project for Radii (Round 2).
Next.js App Router with a real backend inside it (Route Handlers, in-memory data).

- Live: `TODO(hanie): Vercel URL`
- Repo docs: see [docs/](docs/)

> Ownership of this file. `TODO(devin)` sections are filled and kept accurate by the coding agent while it builds. `TODO(hanie)` sections are written by the author in her own words, because they will be discussed in the second call.

## Quick start

```bash
nvm use            # Node version from .nvmrc (v20+)
npm install
npm run dev        # Starts local dev server at http://localhost:3000
```


Switch user (Manager or Staff) and store from the sidebar. There is no real login; the current user is a cookie.

## Scripts

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Dev server                                            |
| `npm run check`      | Typecheck, lint, repo rules, unit and component tests |
| `npm run check:full` | `check` plus production build                         |
| `npm test`           | Vitest (unit, route handler and component tests)      |
| `npm run e2e`        | Playwright end-to-end tests                           |
| `npm run build`      | Production build                                      |

## Tests

- Unit and route handler tests: `npm test`
- End-to-end: `npm run e2e` (builds the app, starts it with E2E=1 and SIMULATED_LATENCY_MS=0, runs tests)

## Tech stack

Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, TanStack Query, Zod, Recharts, Vitest + React Testing Library, Playwright. Deployed on Vercel.

Extra libraries and why: `papaparse` (CSV parsing in browser for previews, column mapping, and error downloads), `axios` (HTTP client with response interceptors for normalized API errors), `clsx` and `tailwind-merge` (`cn` helper for token classes), `class-variance-authority` (cva variant styling), `sonner` (toasts for action feedback).

### Tokens

Design tokens are defined in `src/app/globals.css` as CSS custom properties. Primitives (stone, green, sage, amber, red, blue, violet) are never exposed directly to Tailwind. Semantic tokens (bg-canvas, text-primary, accent-default, status-warn-bg, etc.) are exposed as Tailwind colors, so components use classes like `bg-bg-canvas`, `text-text-primary`, `bg-accent-default`. Text styles are Tailwind utilities (`text-page-title`, `text-body`, `text-mono`, etc.). Hex values are only allowed in globals.css.

## How it works

### How the first page of data gets from the server into TanStack Query

Server Components (`src/app/products/page.tsx`, `src/app/products/[id]/page.tsx`, `src/app/import/page.tsx`) query repositories directly, prefetch queries into a server-side `QueryClient`, dehydrate the cache with `dehydrate(queryClient)`, and pass it to `<HydrationBoundary state={...}>`. Client components (`ProductsView`, `ProductDetailView`, `ImportWizard`) call `useQueryProductList` / `useQueryMeta` / etc. and receive hydrated data synchronously on first render without loading flickers or waterfalls.

### Where permissions are checked, and why in both places

Every write is guarded on the server: Route Handlers wrapped by `withApi(request, handler, { permission })` enforce `roleHasPermission(user.role, permission)` in `src/domain/policy.ts`. If permission fails, a 403 `FORBIDDEN` response is returned. The UI checks the same `roleHasPermission` helper (via `useCan()` or `PermissionGate`) purely to lock buttons, display tooltips, or redirect early. The server is always the authority; client checks are for user experience.

### How a double adjustment is prevented

Mutations require an `Idempotency-Key` header (generated on client with `crypto.randomUUID()`). The repository stores executed requests and responses keyed by `(user.id, idempotencyKey)`. If the exact same payload is submitted with the same key, the service skips duplicate execution and replays the stored response with the `Idempotency-Replayed` header. If the same key is reused with a different payload, the server rejects it with 422 `IDEMPOTENCY_KEY_REUSED`.

### How the transfer's two movements stay consistent

Transfers generate a single unique `transferId`. `applyTransfer` runs inside a repository transaction (`txRepo.transaction()`). Stock availability at the source store and existence at the target store are validated before any writes. Two movements (`transfer_out` and `transfer_in`) are written atomically with the shared `transferId`. If any check fails, the transaction aborts and rolls back completely without writing partial movements.

### Import

- **Flow**: 4-step wizard: Upload (store selection, dropzone, client validation) -> Map columns (auto-alias matching, manual override, required field verification) -> Review (server validation preview, error highlights, error CSV download) -> Done (transaction commit summary, skipped rows download, products link).
- **Template & Sample**: Template at `public/stockroom-import-template.csv`. Sample file at `samples/import-sample.csv` (63 data rows, 15 new creations, 40 updates, 8 invalid rows demonstrating error handling).
- **Limits**: 5 MB file size limit, 2,000 data rows max, 32-character SKU limit, 120-character product name limit.
- **Server authority**: Client PapaParse handles preview and download generation; the server re-validates all rows and applies valid rows atomically.
- **Platform body limits**: Serverless hosts (e.g. Vercel) cap request payloads below 5 MB (~4.5 MB), which can return HTTP 413 before Route Handlers run; these are caught and normalized to `FILE_TOO_LARGE` via `getErrorInfo`.

### API errors

One error shape everywhere. See [docs/API.md](docs/API.md) for codes.

### In-memory data and Vercel

Data is seeded from JSON and kept in memory, as the brief asks. It resets when the server restarts. On Vercel each serverless instance has its own memory, so two requests can see different data. This is fine for a demo, not for production. The demo session cookie is unsigned (the role is resolved server-side from user ID).


## Decisions for the parts that were not designed

`TODO(hanie): in your own words. Start from docs/DECISIONS.md section 2, keep the reasons.`

- Below 1024px:
- Import "Done" step:
- Product with no movements:
- What Staff see on /import:
- Saving state in the dialog:

## Answers to the "Open questions" in the Handoff notes

`TODO(hanie): from docs/DECISIONS.md section 1`

- Reorder level 0 and Low:
- Transfer to the same store:
- Sorting by Status:
- Chart with one point:

## AI usage

`TODO(hanie): write this yourself. Be specific.`

- Tools used and what each was used for. The agent chain (Devin Desktop with three roles: Builder, Tester, Reviewer; skills in `.devin/skills/`), TDD for the backend, tests after for the UI, and my own line-by-line review before every commit:
- At least one thing I changed or threw away, and why:
- How I checked that I can explain all the code:

(Working notes are in [docs/AI_LOG.md](docs/AI_LOG.md).)

## What I cut

`TODO(hanie): fill at the end, honestly. Phase 7 items that were not done go here.`

## What I would do next

`TODO(hanie)`

## Three things I would change in a second version

`TODO(hanie)`
