# Plan (reduced scope for the deadline)

The brief's own rule: a smaller app that is correct and well tested beats everything half done. Anything cut is listed in the README under "What I cut", with the reason. The prompts for each step are in `docs/PROMPTS.md`.

## In scope

| Area           | Included                                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend        | everything already built: read routes, adjustments with permissions, rules, idempotency, atomic transfer, error format                                                                 |
| Products list  | Server Component prefetch, URL state, store switcher, user switcher, search, category and status filters, sort, paging, 4 cards (display), loading, empty (two kinds) and error states |
| Product detail | header, tabs, details card, stock by store, simple 30-day chart, Movements tab with type filter and paging                                                                             |
| Adjust dialog  | four types, validation, server errors, Staff locks, idempotency key, toast, cache updates without reload                                                                               |
| Tests          | the ones the brief lists (see below)                                                                                                                                                   |
| Delivery       | README, Vercel deploy                                                                                                                                                                  |

## Cut (go into "What I cut")

Import UI and the import commit route (the validate route stays, see step 7), clickable summary cards, row selection and CSV export, filter chips, row menu, preview in the dialog, swap button, chart tooltip and 7d/90d ranges, mobile cards and slide-in menu beyond "usable" (tables scroll horizontally), component tests, separate Tester and Reviewer agents, Phase 7.

## Tests the brief asks for

1. Unit tests for the stock rules (status, below zero, transfer totals), probably done.
2. Route handler tests: Staff 403 for write-off, transfer and import; oversell returns the error code. Probably done for the first two. The import 403 test needs the validate route (step 7).
3. CSV row validation tests with at least five kinds of problem (prompt 7).
4. Playwright: Manager filters, opens a product, transfers, both stores change (prompt 8).
5. Playwright: Write-off and Transfer locked for Staff (prompt 8).

## Order and time (about 14 hours)

| #   | Step                                                          | Time |
| --- | ------------------------------------------------------------- | ---- |
| 1   | Shell, URL state, list foundation                             | 2h   |
| 2   | List features and states                                      | 1.5h |
| 3   | Product detail and Movements                                  | 2h   |
| 4   | Chart                                                         | 45m  |
| 5   | Dialog form                                                   | 1.5h |
| 6   | Dialog wiring                                                 | 1.5h |
| 7   | CSV validation function, validate route (no commit) and tests | 1.5h |
| 8   | Two Playwright tests                                          | 1.5h |
| 9   | README and deploy                                             | 1.5h |
| -   | Buffer and visual polish by you                               | 1h   |

## If time runs short, cut in this order

1. Chart (step 4)
2. Movements type filter
3. Second Playwright test (keep the transfer one)
4. Step 7 down to five tests

Never cut: server permissions, server validation, idempotency, atomic transfer, the dialog with its wiring, the README, the deploy.

## Risks

- Query keys differ between server and client: build them in one file.
- Playwright tests share the in-memory store: call the reset route before each test.
- Code you cannot explain: read every diff before you commit, and write the AI usage section honestly.
