# Conventions

Goal: code that is boring, consistent and easy to explain in a live walkthrough. When in doubt, choose the simpler option. Rules marked **[lint]** are enforced by tools, so reviewers do not need to look for them.

## 1. Naming

| Thing | Style | Example |
|---|---|---|
| Files and folders | kebab-case | `stock-by-store-table.tsx`, `use-product-filters.ts` |
| React components | PascalCase export, one per file, file name matches | `StockByStoreTable` in `stock-by-store-table.tsx` |
| Hooks | `useXxx`, file `use-xxx.ts` | `useProductFilters` |
| Functions | camelCase, start with a verb | `getStatus`, `planTransfer`, `parseMoneyToSen` |
| Variables | camelCase, nouns | `onHand`, `reorderLevel` |
| Booleans | `is` / `has` / `can` / `should` prefix | `isLocked`, `hasMovements`, `canWriteOff` |
| Types and interfaces | PascalCase, no `I` prefix, no `Type` suffix | `Product`, `StockMovement` |
| Zod schemas | camelCase + `Schema`; type inferred with same base name | `adjustmentSchema` -> `type Adjustment = z.infer<...>` |
| True constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `MAX_IMPORT_ROWS` |
| Unions instead of enums | string literal unions | `type Role = "manager" \| "staff"` **[lint: no TS enum]** |
| Money | suffix `Sen`, integer | `unitCostSen` |
| Quantities | `quantity` (input), `onHand` (state), `delta` (signed change) | |
| Error codes | UPPER_SNAKE_CASE strings | `INSUFFICIENT_STOCK` |
| Query keys | built only in `lib/client/query-keys.ts` | `queryKeys.products.list(params)` |
| API routes | plural nouns, kebab-case | `/api/products/:id/stock-history` |
| URL params | camelCase, short | `store`, `q`, `pageSize` |
| Event handlers | `handleXxx` in the component, `onXxx` as props | `onSubmit`, `handleSubmit` |
| Test files | next to the code, `name.test.ts(x)`; e2e in `e2e/name.spec.ts` | |

No abbreviations except common ones (`id`, `url`, `sku`, `qty` is not allowed, write `quantity`). No names like `data`, `item`, `temp`, `handler2`.

## 2. Structure

- Group by feature, then by role: `components/products/`, `components/adjust/`, `components/import/`.
- Pure business logic lives in `lib/domain` and never imports React, Next or the server. It is shared by client and server.
- Server-only code lives in `lib/server` and starts with `import "server-only"` where it could leak.
- No barrel `index.ts` files except `lib/server/repo/index.ts` (the one place that chooses the implementation).
- No default exports, except what Next.js requires (`page`, `layout`, `loading`, `error`, `route` handlers use named exports) **[lint]**.
- Imports use the `@/` alias, never `../../..`. Order: node/react, third party, `@/` internal, relative, types last. **[lint/prettier]**
- Size limits: a component file under about 150 lines, a function under about 40 lines, a file under 250 lines **[lint: max-lines warn]**. Split by responsibility, not by line count.
- A component does one job. Data fetching lives in hooks or Server Components, not inside presentational components.
- No dead code, no commented-out code, no TODOs without a name and a reason (`TODO(devin): ...` or `TODO(hanie): ...`).

## 3. TypeScript

- Strict mode. No `any`, no non-null `!`, no `as` casts except `as const` **[lint]**.
- Use `import type` for type-only imports **[lint]**.
- Parse every boundary with Zod: request bodies, query params, cookies, imported CSV rows, JSON seed.
- Prefer discriminated unions for variants (the four adjustment types).
- Function parameters: positional up to 2, an options object beyond that.
- Explicit return types on exported functions.
- Money and quantities are `number` but always integers; guard with `Number.isInteger` in domain code.
- Dates travel as ISO 8601 strings in UTC; convert only when displaying.

## 4. React and Next.js

- Server Component by default. Add `"use client"` only to the smallest component that needs state, effects or browser APIs.
- Derive values during render. Do not use `useEffect` to compute state from props or state.
- Server state is TanStack Query only. No fetching in `useEffect`. URL is the source of truth for list state.
- Forms: controlled inputs, validate with the same Zod schema as the server, show server `fieldErrors` under fields.
- Every interactive control is a real `button`, `a`, `input`, `select` or a shadcn/Radix primitive.
- Tailwind: classes through theme tokens only, merged with the `cn()` helper. No inline `style`, no raw hex **[repo rules script]**. Class order by the Prettier plugin **[prettier]**.
- Accessibility: labels for inputs, `aria-live` for async results, visible focus ring, status = icon + text + color, never color alone.

## 5. API and server

- Routes only call `withApi`, parse input, call one service function, return JSON.
- Services return typed results or throw `AppError(code, status, message, fieldErrors)`. They never return HTTP objects.
- No business rule in a route handler and no HTTP concept in `lib/domain`.
- No `await` between a stock check and the stock write inside a transaction.

## 6. Comments

- Explain why, not what. A comment is needed when a rule is not obvious (for example why reorder level 0 is never Low).
- Public domain functions get a one-line JSDoc with the rule.

## 7. Tests

- Test names read as sentences: `describe("getStatus")` then `it("returns out when on hand is 0")`.
- Arrange, Act, Assert, separated by a blank line.
- One behavior per test. No logic (loops, ifs) in tests.
- Domain tests: pure, no mocks. Table-driven with `it.each` for status and import rows.
- Route tests: call the handler with a real `Request`, reset the store in `beforeEach`.
- Component tests (React Testing Library): query by role and accessible name, then by label. `data-testid` is the last resort. Use `userEvent`, not `fireEvent`.
- No snapshot tests. No testing implementation details or internal state.
- Test data comes from small builders in `tests/builders.ts` (`buildProduct()`), not copy-pasted objects.
- Playwright: role and label locators, no `waitForTimeout`, reset the store with the test route before each test, one user story per test.
- A bug fix starts with a failing test.

## 8. Commits and docs

- Format: `<type>(<scope>): <short description>`, imperative, under 72 characters. Types: `feat`, `fix`, `refactor`, `test`, `style`, `perf`, `docs`, `chore`. Scope is the area: `domain`, `inventory`, `products`, `detail`, `import`, `api`, `ui`, `e2e`, `docs`.
- Examples: `feat(inventory): add transfer service`, `test(domain): add failing tests for stock status`.
- One logical change per commit. Update the docs in the same commit when behavior or a decision changes.

## 9. What is enforced where

| Check | Where |
|---|---|
| Types, no `any` | `tsc` |
| Enums, default exports, imports, max lines, `!`, `any`, casts | ESLint (rule list in `docs/PROMPTS.md`, step 0.2) |
| Formatting, class order | Prettier |
| Hex colors, ts-ignore, console.log, float money | `scripts/check-rules.mjs` |
| Behavior | Vitest, Playwright |
| Staged files and types | pre-commit hook (`lint-staged`, `tsc`) |
| Everything above except e2e | pre-push hook (`npm run check`); `npm run check:full` at phase end |

A reviewer (human or AI) should spend time on what tools cannot check: correctness against the docs, naming quality, simplicity, test quality, accessibility.
