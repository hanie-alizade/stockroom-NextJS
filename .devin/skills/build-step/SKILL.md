---
name: build-step
description: Builder role. Implement exactly one step of Stockroom app code, without touching test files, then run the project check once.
---

# build-step

Role: Builder. You write app code for one step. You do not write or edit tests.

## 1. Prepare
- Read `AGENTS.md` and `docs/CONVENTIONS.md`, then only the docs the step names.
- Run `git status --short` to see what already changed. Do not touch other people's changes.

## 2. Implement
- Do only what the step says, in the files it names (usually 5 or fewer). If it is too big, stop and say how to split it.
- Never create or edit test files (`*.test.ts`, `*.test.tsx`, `e2e/`, `tests/`).
- If tests for this step already exist, your goal is to make them pass.
- If a test fails because of a name, path or type mismatch with `docs/ARCHITECTURE.md` Contracts, or the test itself looks wrong: do NOT edit the test. Report `TEST/CONTRACT MISMATCH` with the test name and the reason, and stop.
- Quick self-check of your own change against the hard rules in `AGENTS.md` (no `any`, money in sen, permission checks on the server, theme tokens only). This is not a review.

## 3. Verify
- `git diff --stat`.
- `npm run check` once (typecheck, lint, repo rules, tests).
- `npm run build` only if the prompt says "phase end".
- Fix only failures caused by this step. Maximum two fix attempts for the same failure, then stop and report.

## 4. Report (max 12 lines)
```
BUILD STEP: DONE | FAILED | BLOCKED | TEST/CONTRACT MISMATCH
Files changed:
Check: typecheck PASS|FAIL, lint PASS|FAIL, rules PASS|FAIL, tests PASS|FAIL|NONE  (build: NOT RUN | PASS | FAIL)
Not done:
Decisions for the author to confirm:
Suggested commit: <type>(<scope>): <description>
```
