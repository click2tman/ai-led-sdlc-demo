---
id: 2026-06-06-0120-infra-multi-tool-enforcement-floor
layer: infra
issue: none
context_pack: none
started: 2026-06-06 01:20 EDT
ended: in-progress
author: Tamba S Lamin
actor: claude
branch: chore-multi-tool-enforcement-floor
---

# Session: multi-tool-enforcement-floor

## Overview
Make the AI-led SDLC harness's governance enforceable when a developer
uses Codex CLI or Gemini CLI instead of Claude Code. The harness today
enforces policy through Claude-Code-specific hooks (settings.json events,
`.tool_input.*` JSON payloads), which Codex and Gemini do not emit. This
session builds the one genuinely tool-agnostic enforcement layer: git
hooks (`commit-msg`, `pre-commit`) that every commit passes through
regardless of which AI authored it, reusing the existing
`.claude/scripts/scan-secrets.sh` and the trailer/header logic. Also
generates `AGENTS.md` (Codex) and `GEMINI.md` (Gemini) from `CLAUDE.md` +
`.claude/rules/`. No SPEC phase governs this (multi-tool support is not in
SPEC §19); tracked as harness tooling on a chore branch.

## Goals
- [x] `.githooks/commit-msg` enforces the traceability trailer
- [x] `.githooks/pre-commit` runs secret scan + new-file header + three-layer grep
- [x] `.claude/scripts/install-git-hooks.sh` sets `core.hooksPath`
- [x] `.claude/scripts/gen-agent-memory.sh` generates AGENTS.md and GEMINI.md
- [x] Hooks reuse existing `.claude/scripts/` logic (one source of truth)
- [x] Document the known gaps (reset --hard / force-push / hook-bypass not git-hook-enforceable)

## Plan
Portable enforcement floor only (per user decision). Per-tool slash
command / subagent / skill parity is explicitly out of scope. CI mirror
of the hooks deferred to a follow-up.

## Updates
- 2026-06-06 01:20 EDT - Built and committed the floor (commit 03fa97b) on
  branch chore-multi-tool-enforcement-floor. Both git hooks tested:
  commit-msg blocks a missing trailer / exempts merges; pre-commit blocks
  a headerless new file, a hard-coded string, and an attraction name.
  Fixed a bash 3.2 portability bug (mapfile -> while-read; guarded empty
  array expansion under set -u). The Claude Code pre-tool-bash hook also
  fired on the first commit attempt because the body contained the literal
  hook-bypass flag string; reworded.

## Findings
- `pre-tool-bash.sh`, `pre-tool-edit.sh`, `scan-secrets.sh` hold the
  enforcement logic to mirror. `scan-secrets.sh --staged` is already
  git-native and reusable unchanged.
- `reset --hard`, `push --force` fire no git hook; `--no-verify` skips
  hooks by definition. These cannot be enforced at the git-hook layer;
  CI is the only backstop. Documented as a known gap.
- The spec-first *prompt* gate has no git analogue; the `commit-msg`
  trailer is its commit-time equivalent.

## Open questions

## Outcomes

## Next session
