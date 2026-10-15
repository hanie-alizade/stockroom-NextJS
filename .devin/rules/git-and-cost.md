---
description: Git safety, cost control and output format for every task in this repo
alwaysApply: true
---

# Git and cost rules

The prompt names a skill (`build-step`, `test-first`, `test-after`, `review-step`). Follow that skill. If the prompt names none, ask which role to use before doing anything.

## Git (read-only)
- Allowed: `git status --short`, `git diff --stat`, `git diff -- <specific files>`, `git log --oneline -n 10`.
- Never run `git commit`, `git commit --amend`, `git add`, `git push`, `git stash`, `git reset`, `git checkout`, `git restore`, `git switch`, `git branch`, `git merge`, `git rebase`, `git tag`, or anything that changes history, branches, the index or files outside the task.
- The author reviews your changes in the working tree, accepts them, and commits herself.
- Preserve existing uncommitted changes. Never overwrite or discard them.
- Only suggest one commit message as plain text: `<type>(<scope>): <short description>`. Types: feat, fix, refactor, test, style, perf, docs, chore. Never execute it.

## Cost
- Do exactly the step in the prompt. Do not start the next step.
- Do not open files to "understand the project". Use the docs table in `AGENTS.md` and only the docs the step names.
- Do not print a full `git diff`. Use `--stat`, or diff only named files.
- Run `npm run check` once at the end, not after every edit. While working, run a single test file.
- Do not run `npm run build` or `npm run e2e` unless the prompt says so.
- If a check fails, fix and re-run. After the third failure of the same check, stop and report the error and your best guess.
- Never weaken lint, TypeScript or test config, never suppress errors, never change versions, never install packages that are not approved in `AGENTS.md`.
- Do not create extra documents or reports.

## Final message
At most 12 lines, in the format of the active skill. End with the suggested commit message line.

## Flow (every session)
1. One chat is one step and one role. The prompt names the skill.
2. Builder writes app code only. Tester writes tests only. Reviewer reads only.
3. TDD steps: the Tester writes failing tests first, then the Builder makes them pass. Never edit a test to make it pass.
4. Leave all changes uncommitted. The author reviews, accepts and commits.
5. Finish with the skill's report and one suggested commit message.