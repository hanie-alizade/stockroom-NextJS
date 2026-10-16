# AGENTS.md

Project facts and hard rules for any coding agent. Agent behavior, git rules and role skills live in `.devin/`.

## Project

Stockroom: small inventory app for Kopi Lane (6 stores). Next.js App Router, Route Handlers as the backend, in-memory data. Take-home assignment: correctness, tests and code the author can explain live matter more than feature count. The written brief wins over Figma.

## Docs: read only what the step needs

| Doc                    | Read when                                   |
| ---------------------- | ------------------------------------------- |
| `docs/CONVENTIONS.md`  | always, before writing code or tests        |
| `docs/ARCHITECTURE.md` | server, data flow, query setup, Contracts   |
| `docs/API.md`          | routes, errors, adjustments                 |
| `docs/IMPORT.md`       | import                                      |
| `docs/DECISIONS.md`    | edge cases and parts that were not designed |

If a task conflicts with a doc, stop and say so.

## Commands

(Created in Phase 0. Keep this table accurate.)

| Command              | Use                                                                          |
| -------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`        | dev server                                                                   |
| `npm run check`      | typecheck + lint + repo rules + unit/component tests                         |
| `npm run check:full` | `check` + `build` (phase end only)                                           |
| `npm test -- <path>` | one test file while working                                                  |
| `npm run e2e`        | Playwright (builds and starts the app with E2E=1 and SIMULATED_LATENCY_MS=0) |

All scripts must exit by themselves (no watch mode, no prompts).

## Hard rules

1. TypeScript strict. No `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, or `as` used to silence types. Parse unknown data with Zod.
2. Money is integer sen. Never floats. Format only at the edge.
3. Status is calculated, never stored: use `getStatus()`.
4. Every write checks `can(role, action)` on the server. The UI uses the same function only to lock or hide.
5. Route Handlers stay thin: parse, authorize, call a service, map errors. Rules live in `lib/domain` (pure) and `lib/server/services`.
6. Services use the repository interface only, never the arrays or maps directly.
7. One error shape everywhere (`docs/API.md`).
8. Theme tokens only. No hex colors or arbitrary pixel values in components.
9. `"use client"` as low in the tree as possible. First render of list and detail is a Server Component with prefetch.
10. Only approved dependencies (below). Ask before adding anything else.
11. Never edit or delete a test to make it pass.

Approved dependencies: next, react, typescript, tailwindcss, shadcn/ui and its Radix parts, @tanstack/react-query, zod, recharts, papaparse (CSV parsing in the browser), vitest, @testing-library/*, jsdom, @playwright/test, eslint (+ typescript-eslint, next config, import and react-hooks plugins), prettier (+ tailwind plugin), husky, lint-staged.

## Roles (details in `.devin/skills/`)

- **Builder** (`build-step`): app code only, never test files.
- **Tester** (`test-first`, `test-after`): test files only, never app code.
- **Reviewer** (`review-step`): read-only.
