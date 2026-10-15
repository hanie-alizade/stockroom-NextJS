# Stockroom

Stock app for Kopi Lane, a cafe chain with six stores. Take-home project for Radii (Round 2).
Next.js App Router with a real backend inside it (Route Handlers, in-memory data).

- Live: `TODO(hanie): Vercel URL`
- Repo docs: see [docs/](docs/)

> Ownership of this file. `TODO(devin)` sections are filled and kept accurate by the coding agent while it builds. `TODO(hanie)` sections are written by the author in her own words, because they will be discussed in the second call.

## Quick start

`TODO(devin): exact steps, tested from a clean clone`

```bash
# expected shape, confirm and correct in Phase 0
nvm use            # Node version from .nvmrc
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

Switch user (Manager or Staff) and store from the sidebar. There is no real login; the current user is a cookie.

## Scripts

`TODO(devin): keep this table in sync with package.json`

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Typecheck, lint, repo rules, unit and component tests |
| `npm run check:full` | `check` plus production build |
| `npm test` | Vitest (unit, route handler and component tests) |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run build` | Production build |

## Tests

`TODO(devin): confirm each command works with one command from a clean clone`

- Unit and route handler tests: `npm test`
- End-to-end: `npm run e2e` (starts the app by itself and resets data between tests)

## Tech stack

Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, TanStack Query, Zod, Recharts, Vitest + React Testing Library, Playwright. Deployed on Vercel.

Extra libraries and why: `TODO(devin): list, for example papaparse for CSV parsing in the browser`

## How it works

### How the first page of data gets from the server into TanStack Query
`TODO(devin): short explanation of the server prefetch, dehydrate and HydrationBoundary flow as built, with file names. Source: docs/ARCHITECTURE.md`

### Where permissions are checked, and why in both places
`TODO(devin): explain can() in lib/domain/policy.ts, the withApi wrapper, and the UI locks`

### How a double adjustment is prevented
`TODO(devin): explain Idempotency-Key, stored response replay, same key with another payload, client key handling`

### How the transfer's two movements stay consistent
`TODO(devin): explain transferId, transaction in the repository, validation before writes, rollback, and the tests that prove it`

### API errors
One error shape everywhere. See [docs/API.md](docs/API.md) for codes.

### In-memory data and Vercel
Data is seeded from JSON and kept in memory, as the brief asks. It resets when the server restarts. On Vercel each serverless instance has its own memory, so two requests can see different data. This is fine for a demo, not for production.

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
