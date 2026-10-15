# Plan

Phases only. The small steps and ready prompts for each phase are in `docs/PROMPTS.md`.

Budget: about 20 hours over 4 days (brief: 16 to 20). Core phases 0 to 6 are about 17.5 hours. Phase 7 is the cut zone and goes first if time runs out.

Priority follows the brief: 1) list, detail, adjust, server rules and permissions; 2) import, movements filters, tests; 3) the rest. The app must be usable at 375px from the first screen, so "usable" is part of every UI phase.

| Day | Phases |
|---|---|
| 1 | 0, most of 1 |
| 2 | finish 1, 2, start 3 |
| 3 | finish 3, 4 |
| 4 | 5, 6, 7 |

## Phase 0: Foundations (about 1h)
- **Goal:** an empty but deployable app with all tooling.
- **Scope:** Next.js app, scripts, ESLint and Prettier, husky hooks, Vitest and Playwright config, Figma tokens in the Tailwind theme, first Vercel deploy.
- **Done when:** `npm run dev`, `npm run check` and the Vercel URL work.
- **Method:** Builder only.

## Phase 1: Domain rules and API (about 3.5h)
- **Goal:** the whole backend works and is proven by tests before real UI exists.
- **Scope:** seed data, pure domain rules (status, money, policy, stock rules), repository, `withApi` wrapper, read routes, adjustments with idempotency and atomic transfer.
- **Done when:** every rule in the brief's "Adjust stock" and "backend rules" sections is covered by a passing test.
- **Method:** TDD. Tester writes failing tests first, Builder makes them pass. Read routes get tests after.
- **Review:** R1 at the end.

## Phase 2: App shell and Products list (about 3h)
- **Goal:** priority 1, first half.
- **Scope:** layout, store and user switchers, mobile menu, query setup, URL state, server prefetch, table with sort, filters, search, pagination, summary cards, loading, empty and error states.
- **Done when:** a shared link opens the same view, the store switcher changes every number, all states can be seen with `?fail=1` and the delay.
- **Method:** Builder first, Tester after.

## Phase 3: Product detail and Adjust stock (about 4h)
- **Goal:** priority 1, second half. The heart of the assignment.
- **Scope:** detail page and tabs, details card, stock by store, 30-day chart, Movements tab, adjust dialog with four types, saving state, focus handling, cache updates, Staff locks.
- **Done when:** a Manager transfers stock and both stores update on detail, list and cards with no reload and no double apply.
- **Method:** Builder first, Tester after.
- **Review:** R2 at the end.

## Phase 4: Import (about 3h)
- **Goal:** priority 2, first item.
- **Scope:** row validation, import service and routes, sample CSV, upload, column mapping, review, done step, Staff screen.
- **Done when:** the sample file imports end to end and broken rows download.
- **Method:** server side is TDD (Tester first). UI is Builder first, Tester after.

## Phase 5: E2E and accessibility (about 1.5h)
- **Goal:** priority 2, last items.
- **Scope:** the two Playwright tests from the brief, keyboard pass, 375px check, fix the bugs they reveal.
- **Done when:** each suite runs with one command and passes.
- **Method:** Tester writes the e2e tests, Builder fixes app bugs.

## Phase 6: Deploy and README (about 1.5h)
- **Goal:** everything Saleh asked for in writing, while it is fresh.
- **Scope:** README sections from the real code, your own sections (decisions, AI usage, cuts), final deploy, last read-through.
- **Done when:** someone new can run the project and understand the decisions from the README.
- **Review:** R3 on the full diff before sending.

## Phase 7: Cut zone, "Polish Pool" (about 2.5h, drop first)
- **Goal:** the brief's priority 3 items, only if everything above is done.
- **Scope, in this order:** clickable Low stock and Out of stock cards; export of selected rows to CSV; chart tooltip; mobile and tablet polish beyond "usable"; small extras.
- **Method:** Builder first, Tester after where it adds value.
- **Not done means:** write it under "What I cut" in the README.

## Cut rules
- End of Day 1: if Phases 0 and 1 are not mostly done, stop planning UI and finish the API first.
- More than 2 hours behind at the end of Day 2: email Saleh early (he asked for that) and drop Phase 7.
- Import short on time: keep mapping and server validation, cut the Done step polish and the broken-rows download last.
- Never cut: server permissions, server validation, idempotency, atomic transfer, the listed tests, the README answers.

## Risks
- Query keys differ between server and client: build them in one file.
- Store lost on dev hot reload: keep it on `globalThis`.
- Playwright tests share state: reset before each test.
- Over-engineering the repository layer: keep the interface to what the rules need.
- Code you cannot explain: read every diff before you commit, simplify what you cannot explain.
