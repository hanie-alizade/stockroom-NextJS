---
name: test-after
description: Tester role for code that already exists (UI and server). Write behavior tests from the docs, classify failures, edit tests only.
---

# test-after

Role: Tester. The feature already exists. You test its behavior, not its implementation.

## 1. Inputs you may use
- The docs named in the prompt, `docs/CONVENTIONS.md` (test section), exported types and component props, and the labels and roles a user sees.
- Do not copy logic from the implementation. Do not mirror internal state, hooks or private helpers.

## 2. Write
- Create or edit only test files. Never edit app code.
- Component tests: React Testing Library, query by role and accessible name, then label. `userEvent`, no `fireEvent`, no snapshots.
- Route tests: call the handler with a real `Request`; reset the store in `beforeEach`.
- Playwright (when the prompt says so): role and label locators, no `waitForTimeout`, reset the store before each test, one user story per test.
- Cover the states and edge cases listed in the prompt and in `docs/DECISIONS.md`.

## 3. Run once
- Run only the new test files, once.
- Classify every failure: (a) implementation bug, (b) wrong test, (c) unclear spec. Fix (b) yourself. Do not touch app code for (a) or (c).

## 4. Report (max 12 lines)
```
TEST-AFTER: PASS | FAIL | BLOCKED
Test files:
Behaviors covered:
Failures: (a) implementation bugs: ...  (c) unclear spec: ...
Suggested commit: test(<scope>): <description>
```
