# AGENTS.md

Rules for any coding agent in this repo (Devin, Cursor, Codex, Claude Code, others). Read this first.

## Project

Stockroom: small inventory app for Kopi Lane (6 stores). Next.js App Router, Route Handlers as the backend, in-memory data seeded from `data/seed.json`. Take-home assignment (Frontend Engineer, Round 2): correctness, a few good tests and code the author can explain live matter more than feature count. The written brief wins over Figma.

## Status and scope rule (important)

The app is built through Phase 5 (domain rules, API, products list, product detail, adjust dialog, import). Remaining phases (Playwright, deploy, Postman, nice-to-haves) are in `docs/PLAN.md`. The docs describe the app **as it is built**. Where a doc says "not built" or "gap", do not build it unless the prompt asks.

The feature list inside the prompt decides what to build. Anything not in that list is out of scope, even if a doc mentions it. If you think something in the list is impossible or ambiguous, say so and stop. Refactor tasks follow the task prompt and may move files.

## Docs: read only what the prompt names

| Doc                    | Read when                                                                 |
| ---------------------- | ------------------------------------------------------------------------- |
| `docs/CONVENTIONS.md`  | always, before writing code or tests, even if the prompt does not name it |
| `docs/PLAN.md`         | phases, status, what is left, cut order                                   |
| `docs/ARCHITECTURE.md` | server, data flow, query setup, folder layout, contracts                  |
| `docs/API.md`          | routes, errors, headers, adjustments                                      |
| `docs/UI-NOTES.md`     | UI behavior from Figma annotations and what is built                      |
| `docs/SCREENS.md`      | exact UI copy, names, formats                                             |
| `docs/DECISIONS.md`    | edge cases and parts that were not designed                               |
| `docs/IMPORT.md`       | import validation, import wizard, commit                                  |
| `docs/TESTING.md`      | writing or running any test (unit, route, e2e), test seams and fixtures   |
| `docs/DEPLOYMENT.md`   | env vars, Vercel, production limits                                       |

## Commands

| Command                | Use                                                             |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | dev server                                                      |
| `npm run typecheck`    | `tsc --noEmit`                                                  |
| `npm run lint`         | ESLint                                                          |
| `npm run check:rules`  | repo rules script (hex colors, `@ts-ignore`, float money, logs) |
| `npm run check`        | typecheck + lint + repo rules + Vitest                          |
| `npm run check:full`   | `check` + `build` (only when asked)                             |
| `npm test -- <path>`   | one test file                                                   |
| `npm run e2e`          | Playwright, only when asked (builds and starts the app itself)  |
| `npm run sample:import`| regenerates `samples/import-sample.csv` from the seed           |

All scripts exit by themselves (no watch mode).

## Hard rules

1. TypeScript strict. Avoid `any`. Type assertions (`as`) and non-null `!` are allowed when they are the simple solution; prefer Zod or a type guard where data comes from outside (API, cookies, files). `@ts-ignore` is not allowed. `@ts-expect-error` and `eslint-disable` are allowed only with a short reason in the same comment. Parse unknown data with Zod.
2. Money is integer sen. Never floats. Never `parseFloat` for money (`parseMoneyToSen` in `src/helpers/money.ts`).
3. Status is calculated, never stored: use `getStatus()`.
4. Every write checks `roleHasPermission(role, permission)` on the server. The UI uses the same function only to lock things. Import routes use `withApi(..., { permission })`; adjustments check `ADJUSTMENT_PERMISSION[type]` inside `createAdjustment`, because the permission depends on the body.
5. Route Handlers stay thin. Rules live in `src/domain` and `src/server/services`. Services use the repository interface only.
6. One error shape everywhere (`docs/API.md`).
7. Theme tokens and text-style utilities only. No hex colors, no raw `text-sm` or `font-bold`. Icons only from `src/components/icons/` (Figma SVGs, `currentColor`, colored with `text-*` classes, typed `IconComponent`). Never `lucide-react` in our own components.
8. `"use client"` as low in the tree as possible. First render of list and detail is a Server Component with prefetch into TanStack Query.
9. Only approved dependencies: next, react, react-dom, typescript, tailwindcss (+ `@tailwindcss/turbopack`), shadcn/ui and its Radix parts (radix-ui), @tanstack/react-query, zod, recharts, papaparse, axios, class-variance-authority, clsx, tailwind-merge, sonner, vitest, @vitejs/plugin-react, @testing-library/*, jsdom, @playwright/test, eslint (+ plugins), prettier (+ tailwind plugin), husky, lint-staged. Ask before anything else.
10. Shared types in `src/types`, Zod schemas in `src/schemas`, fixed values in `src/constants` as `as const` objects (e.g. `export const ROLE = { MANAGER: "manager", STAFF: "staff" } as const;`). Types are derived from them. No hard-coded literal unions or repeated strings: use `ROLE.MANAGER`. Import through barrels (`@/types`, `@/schemas`, `@/constants`, `@/domain`, `@/helpers`, `@/hooks`, `@/api`, `@/apiHooks`, `@/providers`); no deep imports into these folders. Server sub-folders have their own barrels (`@/server/http`, `@/server/repositories`, `@/server/services/<area>`); no barrel at `src/server` root. Server and client use the same types.
11. File names: component folder and file PascalCase (shadcn `components/ui` keeps kebab-case). All other files camelCase. Hooks are `useXxx.ts`. Components use plain names (`Sidebar`, not `AppSidebar`). A component gets its own folder only if it has more than one file. Props use `interface XProps` in the component file. Data shapes use `type`.
12. Never change test assertions to make a test pass. Imports, paths, types, inputs and mocks may change when the task says so. Write new tests only when the prompt asks.
13. Tests follow `docs/TESTING.md`. Playwright: role and label locators, no `waitForTimeout`, reset the in-memory store before each test with `POST /api/test/reset`.

## UI rule

The UI is built. Do not restyle it. Use shadcn/ui components and the theme tokens. Match the region layout of the design (screenshots or `docs/SCREENS.md`), not its pixels. Copy all texts exactly from `docs/SCREENS.md`. Do not add custom CSS files or animations. Tables may scroll horizontally on small screens. The author does the visual polish.

## Working rules

- Do exactly the task in the prompt. Do not start other work. Do not refactor or reformat files you did not need to change.
- Do not open files to "understand the project". Use the docs named in the prompt.
- Run `npm run check` once at the end, not after every edit. Use a single test file while working.
- If a check fails, fix and run again. After the third failure of the same check, stop and report the error and your best guess. Do not weaken lint, TypeScript or test config unless the task says so, never suppress errors, never change versions.
- Do not open a browser, run the dev server for visual checks or take screenshots. Verify with `npm run check` only; the author checks visuals. (Exception: when the prompt is a Playwright task, running `npm run e2e` is the verification.)
- Do not create extra documents or reports. You may update the `TODO(devin)` parts of `README.md` only when the prompt says so. `TODO(hanie)` parts are written by the author.
- If a doc and the code disagree, say so in the final message. Do not silently change either.

## Git (strict)

- Never run `git commit`, `git add`, `git push`, `git stash`, `git reset`, `git checkout`, `git restore`, `git switch`, `git branch`, `git merge`, `git rebase`, or anything that changes history, branches, the index or files outside the task (`git mv` is allowed when the task says so). Only read: `git status --short`, `git diff --stat`, `git diff -- <files>`.
- Leave all changes uncommitted. The author reviews, accepts and commits herself. Preserve her existing uncommitted changes.
- You may suggest one commit message as plain text: `<type>(<scope>): <description>` (types: feat, fix, refactor, test, style, perf, docs, chore).

## Final message

At most 8 lines: the feature checklist from the prompt with done or not done for each item, files changed, `npm run check` result (and `npm run e2e` when it was part of the task), and the suggested commit message.
