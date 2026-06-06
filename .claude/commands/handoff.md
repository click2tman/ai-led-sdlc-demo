---
description: Package the current branch into a draft PR ready for human review. Confirms a clean tree, runs verification-loop, spawns code-reviewer and security-reviewer, writes the PR body, opens a draft PR, and comments the URL on the issue. Claude never merges.
allowed-tools: Bash, Read, Write, Edit, Grep, Agent
---

# /handoff

The end of the AI's 80 percent: a draft PR a human reviews and merges.
Claude never runs `gh pr merge` (denied by hook).

## Procedure

1. **Confirm a clean working tree** (`git status --porcelain` empty). If
   dirty, stop and tell the user to `/code-push` first.

2. **Run `verification-loop`** (`npm run lint`, `npm run typecheck`,
   `npm run build`, secret scan — available after Phase 1). Stop on any
   failure.

3. **Spawn the `code-reviewer` agent.** Apply non-controversial fixes,
   then re-run verification-loop. Re-commit via `/code-push` if anything
   changed.

4. **Spawn the `security-reviewer` agent.** Block on any High finding —
   do not open the PR until it is resolved or explicitly waived by the
   user. Surface Medium findings in the PR body.

5. **Spawn the `docs-writer` agent** to produce the PR body. It must
   reference the SPEC phase/section and the issue (per `spec-first.md`),
   summarise the change, and list the verification results.

6. **Choose the PR base** (per `branch-conventions.md`):
   - Feature/fix/chore branch (`issue-<num>-<slug>`) -> base `dev`.
   - Promotion branch (`promote-dev-to-main-<date>`) -> base `main`.
   - Hotfix branch (`hotfix-<num>-<slug>`) -> base `main`.

7. **Push and open the draft PR**:
   ```
   git push -u origin <branch>
   gh pr create --draft --base <dev|main> --title "<type: summary>" --body-file <body>
   ```
   The four CI gates (`ci.yml`, `codeql.yml`, `security.yml`, `a11y.yml`)
   run on the PR; all must be green before a human merges.

8. **Comment the PR URL on the originating issue** (`gh issue comment`).

9. **Run** `/session-update "handoff: draft PR <url> opened against <base>"`.

10. **Print** the PR URL and the human-reviewer checklist: review the
    diff, confirm the four CI gates pass, confirm SPEC trace in the body,
    then squash-merge.

## Hard rules

- Never `gh pr merge` — Claude opens the PR; a human merges it.
- Never open a non-draft PR.
- Never open a PR with verification-loop red or an unresolved High
  security finding.
