# Conventions

Goal: code that is boring, consistent and easy to explain in a live walkthrough. When in doubt, choose the simpler option. Rules marked **[lint]** are enforced by tools, so reviewers do not need to look for them.

## 1. Naming

| Thing             | Style                                                                                                                              | Example                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Files             | component folder and file PascalCase (shadcn keeps kebab-case); all other files camelCase                                          | `Sidebar.tsx`, `StockByStoreTable.tsx`, `useProductFilters.ts`, `stockRules.ts` |
| Folders           | component folder PascalCase (if >1 file); other folders lowercase, one word where possible                                         | `components/Sidebar/`, `domain`, `helpers`                                      |
| React components  | PascalCase export, one per file; component folder and file PascalCase                                                              | `Sidebar` in `Sidebar.tsx`, `StockByStoreTable` in `StockByStoreTable.tsx`      |
| Hooks             | `useXxx`, file `useXxx.ts`                                                                                                         | `useProductFilters` in `useProductFilters.ts`                                   |
| Functions         | camelCase, start with a verb                                                                                                       | `getStatus`, `planTransfer`, `parseMoneyToSen`                                  |
| Variables         | camelCase, nouns                                                                                                                   | `onHand`, `reorderLevel`                                                        |
| Booleans          | `is` / `has` / `can` / `should` prefix                                                                                             | `isLocked`, `hasMovements`, `canWriteOff`                                       |
| Types             | PascalCase, no `I` prefix, no `Type` suffix; `type` for data shapes                                                                | `Product`, `Movement`                                                           |
| Shared type files | `src/types/<module>.ts`, camelCase                                                                                                 | `product.ts`, `movement.ts`, `common.ts`                                        |
| Props types       | local to the component file, `interface <Component>Props`                                                                          | `interface NavItemProps`                                                        |
| Zod schemas       | in `src/schemas/`, camelCase + `Schema`; type inferred with same base name                                                         | `adjustmentSchema` -> `type Adjustment = z.infer<...>`                          |
| Fixed values      | in `src/constants/` as `as const` objects; types derived from them                                                                 | `export const ROLE = { MANAGER: "manager", STAFF: "staff" } as const;`          |
| Constant usage    | use constant object members, no repeated strings or hard-coded literal unions                                                      | `ROLE.MANAGER`                                                                  |
| Money             | suffix `Sen`, integer                                                                                                              | `unitCostSen`                                                                   |
| Quantities        | `quantity` (input), `onHand` (state), `delta` (signed change)                                                                      |                                                                                 |
| Error codes       | UPPER_SNAKE_CASE strings                                                                                                           | `INSUFFICIENT_STOCK`                                                            |
| Query keys        | built only in `src/constants/queryKeys.ts`                                                                                         | `queryKeys.products.list(params)`                                               |
| API routes        | plural nouns, kebab-case                                                                                                           | `/api/products/:id/stock-history`                                               |
| URL params        | camelCase, short                                                                                                                   | `store`, `q`, `pageSize`                                                        |
| Event handlers    | `handleXxx` in the component, `onXxx` as props                                                                                     | `onSubmit`, `handleSubmit`                                                      |
| Test files        | in `__tests__/` next to the code, named after the module (`status.test.ts`, `route.test.ts`); e2e in `e2e/` as `camelCase.spec.ts` | `status.test.ts`, `managerTransfer.spec.ts`                                     |

Exceptions to the file rule: files generated by shadcn in `components/ui/` keep their kebab-case names (do not rename them), and root config files, `scripts/` and `docs/` keep theirs.

Component names are plain domain nouns: `Sidebar`, `StoreSwitcher`, `StatusBadge`. No `App`, `My`, `Custom` or `Base` prefixes, no `Component` suffix. A component gets its own folder only if it has more than one file.

No abbreviations except common ones (`id`, `url`, `sku`, `qty` is not allowed, write `quantity`). No names like `data`, `item`, `temp`, `handler2`.

## 2. Structure

Layout as built (details in `docs/ARCHITECTURE.md`):

```
src/
  app/ (routes only)
  api/ (HTTP client)
  components/{ui,icons,common,layout,<feature>}
  config/
  constants/
  schemas/
  types/
  domain/
  helpers/
  hooks/ (client hooks)
  apiHooks/ (TanStack Query hooks)
  providers/
  server/{http,repositories,services} + session.ts, guards.ts
Outside src:
  tests/ (setup, helpers)
  e2e/
  data/
```

- Imports go only downwards: `constants -> schemas -> types -> domain, helpers -> server, api, apiHooks, hooks -> components -> app`.
- Import through barrels: `@/helpers`, `@/types`, `@/constants`, `@/schemas`, `@/domain`, `@/hooks`, `@/api`, `@/apiHooks`, `@/providers`. No deep imports into these folders. No barrel at `src/server` root; server sub-folders have their own (`@/server/http`, `@/server/repositories`, `@/server/services/<area>`). `src/server/session.ts` and `src/server/guards.ts` are single files imported by path.
- Scope: a helper, hook or type used in more than one place goes to the shared folder. Used by one component only: next to it.
- A component gets its own folder only if it has more than one file. Props use `interface XProps` in the component file. Data shapes use `type`.
- No empty files or folders. No `lib` folder: shared client code goes to `hooks` or `helpers`.
- Size guidance (not lint errors): file up to 250 lines, component up to 150, function up to about 40, positional params up to 3 (an options object beyond that). Split by responsibility, not by line count.
- Pure business logic lives in `src/domain` and `src/helpers`, and never imports React, Next or the server. It is shared by client and server.
- Server-only code lives in `src/server` and starts with `import "server-only"` where it could leak.
- No default exports, except what Next.js requires (`page`, `layout`, `loading`, `error`, `not-found`, `route` handlers use named exports) **[lint]**.
- Imports use the `@/` alias, never `../../..`. Order: node/react, third party, `@/` internal, relative, types last. **[lint/prettier]**
- A component does one job. Data fetching lives in hooks or Server Components, not inside presentational components.
- Split a component only for one of these reasons: it needs `"use client"` while its parent does not; it is used in more than one place; it has its own state or data; or it is longer than about 150 lines. A static block of 15 lines stays inside its parent.
- Icons live in `src/components/icons/` (Figma SVGs, one component per file, `currentColor`, colored by `text-*` classes on the icon or its parent). They use `IconProps` and `IconComponent` from `@/types/common` (or `@/types`). Components receive an icon as a prop typed `IconComponent` and render it as `<Icon />`; never `cloneElement`, never JSX elements as icon props. Never `lucide-react` in our own components (only generated files in `components/ui/` may keep it).
- No dead code, no commented-out code, no TODOs without a name and a reason (`TODO(devin): ...` or `TODO(hanie): ...`).

## 3. Shared types, schemas and constants

All shared data shapes, schemas and constants live in dedicated top-level directories:

- `src/constants/`: fixed values as `as const` objects, e.g. `export const ROLE = { MANAGER: "manager", STAFF: "staff" } as const;`. Query keys in `constants/queryKeys.ts`. No hard-coded literal unions or repeated strings: use `ROLE.MANAGER`. Types are derived from them.
- `src/schemas/`: Zod schemas (the single source of truth for runtime validation: request bodies, query params, cookies, file imports).
- `src/types/`: shared data shapes that more than one file uses, so the server, domain code and client use the same type. Never declare a new shape for API or domain data elsewhere; reuse or extend those.

Imports go only downwards: `constants -> schemas -> types`.
Import through barrels: `@/constants`, `@/schemas`, `@/types`.

| File            | Holds                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `common.ts`     | cross-cutting types: `ErrorCode`, `FieldError`, `ApiErrorBody`, `Paginated<T>`, `PageSize`, `SortDirection`, `IconProps`, `IconComponent` |
| `store.ts`      | `StoreId`, `Store`, `StoreScope`                                                                                                          |
| `user.ts`       | `Role`, `Permission`, `User`                                                                                                              |
| `product.ts`    | `StockStatus`, product list and detail shapes, list query, summary, stock by store, stock history                                         |
| `movement.ts`   | `MovementType`, `MovementDraft`, `Movement`, movement list query and response                                                             |
| `adjustment.ts` | `Adjustment`, `AdjustmentResult`                                                                                                          |
| `import.ts`     | import fields, error codes, row result, validation response                                                                               |

Rules:

- Only type declarations in `src/types/`. No runtime code, no enums (derive from `as const` constants or Zod schemas), no imports from `components/`, `server/` or `app/`. A types file may import from constants, schemas, or another types file.
- Types that come from a Zod schema are inferred from it (`z.infer`). Types that come from fixed constants are derived using `typeof` / indexed access.
- Services declare their return types with these types, and the client API client and hooks use the same ones. The browser does not redefine a response shape.
- Component props use `interface XProps` in the component file. Data shapes use `type`.
- A helper, hook or type used in more than one place goes to the shared folder. Used by one component only: next to it.
- No empty files or folders.

## 4. TypeScript

- Strict mode stays (`strict: true`). Avoid `any`.
- Type assertions (`as`) and non-null `!` are allowed when they are the simple solution; prefer Zod or a type guard where data comes from outside (API, cookies, files).
- `@ts-ignore` is not allowed.
- `@ts-expect-error` and `eslint-disable` are allowed only with a short reason in the same comment.
- Use `import type` for type-only imports **[lint]**.
- Parse every boundary with Zod: request bodies, query params, cookies, imported CSV rows, JSON seed.
- Prefer discriminated unions for variants (the four adjustment types).
- Function parameters: positional params up to 3, an options object beyond that.
- Explicit return types on exported functions.
- Prefer `type` for data shapes, `interface` for component props (`interface XProps`).
- Money and quantities are `number` but always integers; guard with `Number.isInteger` in domain code.
- Dates travel as ISO 8601 strings in UTC; convert only when displaying.

## 5. React and Next.js

- Server Component by default. Add `"use client"` only to the smallest component that needs state, effects or browser APIs.
- Derive values during render. Do not use `useEffect` to compute state from props or state.
- Server state is TanStack Query only. No fetching in `useEffect`. URL is the source of truth for list state.
- Forms: controlled inputs, validate with the same Zod schema as the server, show server `fieldErrors` under fields.
- Every interactive control is a real `button`, `a`, `input`, `select` or a shadcn/Radix primitive.
- Tailwind: classes through theme tokens only, merged with the `cn()` helper. No inline `style`, no raw hex **[repo rules script]**. Class order by the Prettier plugin **[prettier]**.
- Typography: use the text style utilities from the theme (`text-page-title`, `text-body`, `text-label`, `text-mono`, and so on). Never raw `text-sm` or `font-bold`. SKUs, quantities and money use the mono styles.
- Icons: only from `src/components/icons/` (see section 2). No emoji or font glyphs as icons.
- Accessibility: labels for inputs, `aria-live` for async results, visible focus ring, status = icon + text + color, never color alone.

## 6. API and server

- Routes only call `withApi`, parse input, call one service function, return JSON.
- Services return typed results or throw `AppError(code, status, message, fieldErrors)`. They never return HTTP objects.
- No business rule in a route handler and no HTTP concept in `src/domain`.
- No `await` between a stock check and the stock write inside a transaction.

## 7. Comments

- Explain why, not what. A comment is needed when a rule is not obvious (for example why reorder level 0 is never Low).
- Public domain functions get a one-line JSDoc with the rule.

## 8. Tests

- Tests live in `__tests__/` next to the code, only where tests exist.
- Shared mocks live in `tests/helpers`; a test data builder is added only when a test needs one (`tests/helpers/builders.ts`).
- Test names read as sentences: `describe("getStatus")` then `it("returns out when on hand is 0")`.
- Test rule: never change test assertions to make a test pass. Imports, paths, types, inputs and mocks may change when the task says so.
- Arrange, Act, Assert, separated by a blank line.
- One behavior per test. No logic (loops, ifs) in tests.
- Domain tests: pure, no mocks. Table-driven with `it.each` for status and import rows.
- Route tests: call the handler with a real `Request`, reset the store in `beforeEach`, mock the cookie with `mockCookies("<userId>")`, and run with `SIMULATED_LATENCY_MS=0`. Assert the status and the error `code` in the unified body.
- Component tests (React Testing Library): query by role and accessible name, then by label. `data-testid` is the last resort. Use `userEvent`, not `fireEvent`.
- No snapshot tests. No testing implementation details or internal state.
- No empty files or folders.
- Playwright: role and label locators, no `waitForTimeout`, reset the store with `POST /api/test/reset` before each test, one user story per test. Details and fixtures: `docs/TESTING.md`.
- A bug fix starts with a failing test.

## 9. Commits and docs

- Format: `<type>(<scope>): <short description>`, imperative, under 72 characters. Types: `feat`, `fix`, `refactor`, `test`, `style`, `perf`, `docs`, `chore`. Scope is the area: `domain`, `inventory`, `adjust`, `products`, `detail`, `import`, `api`, `http`, `session`, `layout`, `ui`, `e2e`, `docs`, `repo`.
- Examples: `feat(inventory): add transfer service`, `test(domain): add failing tests for stock status`.
- One logical change per commit. Update the docs in the same commit when behavior or a decision changes.
- Branches: one per phase, named `phase-N-short-name` (see `docs/PLAN.md`). Avoid special characters such as `&` in branch names.
- Line endings are LF (`.gitattributes`). Do not commit CRLF files.

## 10. What is enforced where

| Check                                                                                                                                                          | Where                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Types, strict, avoid `any`                                                                                                                                     | `tsc` (strict mode; ESLint warns on `any`)                                                          |
| Default exports, `../../*` imports, max lines (warn), no-console, eqeqeq, no-nested-ternary (warn), hooks rules, consistent-type-imports, no-floating-promises | ESLint                                                                                              |
| Formatting, class order                                                                                                                                        | Prettier                                                                                            |
| Hex colors, `@ts-ignore`, console.log, float money                                                                                                             | `scripts/check-rules.mjs` (note: `@ts-expect-error` and `eslint-disable` allowed with short reason) |
| Behavior                                                                                                                                                       | Vitest (`npm test`), Playwright (`npm run e2e`)                                                     |
| Staged files and types                                                                                                                                         | pre-commit hook (`lint-staged`, `tsc`)                                                              |
| Everything above except e2e                                                                                                                                    | pre-push hook (`npm run check`); `npm run check:full` at phase end                                  |

A reviewer (human or AI) should spend time on what tools cannot check: correctness against the docs, naming quality, simplicity, test quality, accessibility.
