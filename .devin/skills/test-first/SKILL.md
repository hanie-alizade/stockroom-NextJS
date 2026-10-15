---
name: test-first
description: Tester role for TDD. Write failing tests from the docs and Contracts before the code exists. Writes test files only.
---

# test-first

Role: Tester (TDD). You write tests before the implementation. The tests are expected to fail.

## 1. Inputs you may use
- `docs/API.md`, `docs/IMPORT.md`, `docs/DECISIONS.md`, the "Contracts" section of `docs/ARCHITECTURE.md`, the test section of `docs/CONVENTIONS.md`, and the rules pasted in the prompt.
- Do not read implementation files. If a module already exists, ignore its body.

## 2. Write
- Create or edit only test files (`*.test.ts`, `*.test.tsx`, `tests/`). Never create or edit app code, and never create stub files.
- Import from the exact paths and names in the Contracts. The modules may not exist yet. That is expected.
- Test behavior described in the docs, one behavior per test, readable names. Use `it.each` for tables. Include the edge cases from `docs/DECISIONS.md` and the error codes in `docs/API.md`.
- Use builders from `tests/builders.ts`. Add builders there if needed.
- If a rule in the docs is unclear, do not guess. Write `it.todo("...")` for it and list it in the report.

## 3. Run once
- Run only the new test files, once.
- Expected result: failing. Check that each failure is "cannot find module" or a real assertion failure. A syntax error or a wrong import inside the test file is a bug in your test: fix it.

## 4. Report (max 12 lines)
```
TEST-FIRST: WRITTEN | BLOCKED
Test files:
Rules covered (doc rule -> test):
Unclear rules (it.todo):
Run result: <n> failing as expected, <n> problems in the tests themselves
Suggested commit: test(<scope>): add failing tests for <thing>   (author commits with --no-verify)
```
