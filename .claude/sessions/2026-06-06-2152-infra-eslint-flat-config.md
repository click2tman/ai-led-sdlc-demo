---
id: 2026-06-06-2152-infra-eslint-flat-config
layer: infra
issue: #32
context_pack: none
started: 2026-06-06 21:52 EDT
ended: in-progress
author: Tamba S Lamin
actor: claude-autonomous
branch: chore-eslint-flat-config
---

# Session: eslint-flat-config

## Overview
Migrate ESLint to flat config (eslint.config.js), the prerequisite for
ESLint 9/10. Unblocks dependabot #32 (eslint 8 -> 10) and #26
(eslint-plugin-react-refresh 0.4 -> 0.5). Must preserve every existing
rule, especially jsx-a11y recommended (SPEC §10.5; never weaken it).

## Goals
- [ ] eslint.config.js (flat) equivalent to .eslintrc.cjs, jsx-a11y intact
- [ ] upgrade eslint + plugin; remove .eslintrc.cjs
- [ ] npm run lint clean (same results, including the 3 custom TS rules)
- [ ] gates green; PR to dev; supersede #32/#26

## Plan
Use typescript-eslint meta package (tseslint.config) + @eslint/js +
flat-config exports of jsx-a11y/react-hooks/react-refresh. Verify lint
catches the same issues (spot-check no-explicit-any, jsx-a11y).

## Updates
- 2026-06-06 21:54 EDT - Migrated to eslint.config.js (flat). Toolchain:
  eslint 9.39, @eslint/js, typescript-eslint 8.60 (meta; removed the separate
  @typescript-eslint/eslint-plugin + parser), eslint-plugin-react-refresh
  0.5.2, globals. Config preserves the rule set 1:1: js.recommended,
  tseslint.recommended, jsx-a11y flatConfigs.recommended,
  react-hooks recommended-latest, react-refresh/only-export-components off,
  and the three custom TS rules. Verified via --print-config (rules active:
  no-explicit-any=2, jsx-a11y/alt-text=2, etc.) and a live probe (any +
  missing-alt -> 2 errors). Gates green: lint, typecheck, 48 tests, build,
  a11y 5/5. npm-audit findings are the pre-existing vite5/esbuild dev chain,
  not from this change.

## Findings
- Targeted eslint 9 (not 10 per dependabot #32): typescript-eslint 8 fully
  supports eslint 9; eslint 10 may need a newer tseslint. Flat config is the
  prerequisite either way; bumping to 10 later is now a one-line dep change.
- eslint-plugin-react-refresh bumped to 0.5.2, satisfying dependabot #26.

## Open questions

## Outcomes
ESLint migrated to flat config (eslint 9); rule set preserved and verified,
jsx-a11y intact. Satisfies #26 (react-refresh 0.5); unblocks #32 (the eslintrc
incompatibility is gone - a later bump to eslint 10 is now trivial). PR to dev.

## Next session
