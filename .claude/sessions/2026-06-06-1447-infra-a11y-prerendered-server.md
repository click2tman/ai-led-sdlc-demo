---
id: 2026-06-06-1447-infra-a11y-prerendered-server
layer: infra
issue: #9
context_pack: none
started: 2026-06-06 14:47 EDT
ended: 2026-06-06 15:00 EDT
author: Tamba S Lamin
actor: claude-autonomous
branch: chore-a11y-prerendered-server
---

# Session: a11y-prerendered-server

## Overview
Make the a11y gate test the prerendered artifact that ships, not the plain
SPA. SPEC §10.5, §15; follow-up to the SSG work (PR #34, ADR 0002).

## Updates
- 2026-06-06 14:55 EDT - Added scripts/serve-dist.mjs (dependency-free static
  server: real files + directory index, then SPA fallback - mirrors Vercel's
  routes filesystem handle). playwright.config webServer points at it; a11y.yml
  builds with build:prerender. Verified: build:prerender + a11y 0x5 incl. deep
  routes that vite preview mis-served. lint/typecheck/11 tests green. PR #35 -> dev.

## Findings
- vite preview cannot serve nested prerendered files (SPA fallback wins); the
  custom server resolves directory index.html first, matching Vercel.

## Open questions

## Outcomes
a11y gate now exercises the prerendered build via a Vercel-like static server.
PR #35 -> dev, verified green locally.

## Next session
1. Merge PR #35 -> dev.
2. Promote dev -> main (carries SSG #34 + a11y #35) so production serves the
   prerendered SSG. Tag main vX.Y.Z after.
3. Phase 6 (auth) remains the next feature.
