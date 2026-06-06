---
id: 2026-06-06-0248-cross-layer-phases-1-5-build
layer: cross-layer
issue: #6
context_pack: none
started: 2026-06-06 02:48 EDT
ended: 2026-06-06 18:06 EDT
resumed: 2026-06-06 12:40 EDT
resumed_prior: 2026-06-06 08:25 EDT
author: Tamba S Lamin
actor: claude-autonomous
branch: issue-6-phases-1-5-build
---

# Session: phases-1-5-build

## Overview
Autonomous build of Salone Explorer through SPEC Phases 1, 2, 2.5, 3, 4,
and 5 on a single feature branch, with a draft PR per phase at the end.
Phase 1 scaffolds the Vite + React + TS app (SPEC §19 P1, §12). Phase 2
adds the data, content, and repository layers (SPEC §5, §6). Phase 3
delivers SEO/AEO/GEO/JSON-LD, FambulTik brand, UI, and WCAG 2.2 AA
(SPEC §8, §9, §10, §13, §14). Phase 4 adds the four CI workflows +
dependabot + a11y smoke (SPEC §15, §19 P4). Phase 5 ships the Supabase
schema + RLS and the client (SPEC §6.3, §19 P5). Phase 2.5 adds the
Supabase attractions repository + migration script (SPEC §5.3, §19 P2.5).
Live-infra steps (Vercel link/deploy, Supabase provisioning, running the
migration) are human escalations — all committable artifacts are produced.

## Goals
- [ ] Phase 1: scaffold salone-explorer/ (Vite+React+TS, Tailwind, tokens, logos)
- [ ] Phase 2: types, attractions.json (8 sourced records), regions.json, strings, repository
- [ ] Phase 3: router, components/pages, SEO/JSON-LD/AEO, robots/llms/sitemap, a11y
- [ ] Phase 4: CI workflows (ci/codeql/security/a11y), dependabot, a11y smoke spec, README
- [ ] Phase 5: supabase/schema.sql + RLS, src/lib/supabase.ts
- [ ] Phase 2.5: attractions.supabase.ts + migration script
- [ ] Draft PR per phase to dev; escalate live-infra steps

## Plan
Autonomous policy:
  - Auto-fix lint/typecheck/test failures up to 3 attempts per failure
  - Auto-commit at every green verification-loop
  - Auto-/session-update after every commit
  - Auto-spawn code-reviewer + security-reviewer before /handoff
  - Escalate to human on:
      * architectural decision required (invoke architect, then stop)
      * ambiguous requirement or missing SPEC trace
      * security finding (Medium or High)
      * breaking change to a public contract (the Attraction type,
        the attractions repository interface, the Supabase schema,
        an env var)
      * 3 consecutive failed auto-fix attempts on the same step
      * live-infra step requiring credentials (Vercel, Supabase) — pause
        with exact run instructions for the human

Sequencing: 1 -> 2 -> 3 -> 4 -> 5 -> 2.5. Each phase ends at a green
verification-loop and a commit with the proper Phase/Refs trailer.

## Updates

- 2026-06-06 02:48 EDT - Session opened (autonomous). Branch
  issue-6-phases-1-5-build off origin/dev. Read SPEC.md in full.
  Decisions confirmed with human: one branch, PR-per-phase; produce all
  infra artifacts and escalate only live credential steps.
- 2026-06-06 03:10 EDT - Phase 1 committed (5f44d49). Vite 5 + React 18
  + TS strict + Tailwind 3 + tokens + ESLint(jsx-a11y) + Vitest +
  Playwright. typecheck/lint/build all green. Pinned SPEC stack (React
  18/Vite 5) rather than the React 19/Vite 8 the scaffold offered, for
  peer-dep compatibility with the §3 libraries. See ADR 0002.

### Resume - 2026-06-06 08:25 EDT

Resumed by: Tamba S Lamin
Branch: issue-6-phases-1-5-build
Reason: Replace placeholder attraction images and the placeholder logo with
real assets (logo provided by human; images sourced from Wikimedia Commons
per SPEC §4).

Carrying forward:
  - Real FambulTik logo (awaiting file path from human).
  - Real attraction photos from Wikimedia Commons with license attribution.

## Findings

- 2026-06-06 03:12 EDT - Phase 2 committed (b817231). types.ts, 8 sourced
  attractions, regions, strings (verbatim §17 disclaimer), repository
  (interface/file/barrel/strings). 9 unit tests green. Ratings are
  illustrative seed values (no live reviews until Phase 9), disclaimer-covered.
- Tooling note: run app commands from salone-explorer/ (cwd reverts to
  repo root between Bash calls). vitest/eslint/tsc must run via the app
  dir's node_modules. RTK proxy mangles vitest stdout; redirect to a file
  and Read it.

- ADR 0002: vite-plugin-prerender (SPEC §3) is unmaintained and pulls
  html-minifier (high ReDoS, no fix) + old puppeteer -> 6 high + 1
  critical audit findings that security.yml would fail on. Removed it;
  pre-render will be a Playwright postbuild step (Phase 3, zero new
  deps). Production-only audit (`--omit=dev`) is clean; remaining
  advisories are dev-toolchain (Vitest UI, esbuild dev server) and never
  ship. security.yml will block on `npm audit --omit=dev --audit-level=high`.
  NEEDS HUMAN RATIFICATION on PR review (amends SPEC §3, §15).

- 2026-06-06 03:25 EDT - Phase 3 committed (3bd3bb0). Full UI (data-router
  + loaders), SEO/JSON-LD/AEO, brand, a11y. Verified: typecheck, lint,
  build, 9 unit tests, prerender (10 routes -> static HTML with content +
  valid JSON-LD @graph), axe smoke 0 serious/critical on all 5 routes.
  ADR-0002 prerender implemented as scripts/prerender.ts (Playwright).
  Note: /signin /signup are form shells; Supabase auth handlers are Phase 6
  (out of this run's scope) - submit announces auth.notEnabled via role=status.

## Open questions

- Phase 6 (auth wiring) is out of scope for this run (1,2,2.5,3,4,5). The
  sign-in/up pages render accessibly but do not authenticate yet. Flag for
  the reviewer: do not ship to users as a working auth flow.

- 2026-06-06 03:35 EDT - Phases 4, 5, 2.5 committed (d252af9, d6a3145,
  b5617fe). CI workflows, Supabase schema+client, supabase repo+migration.
- 2026-06-06 03:45 EDT - code-reviewer + security-reviewer run. Applied
  Tier-1 fixes (focus ring, nav labels, disclaimer default-visible,
  breadcrumb, CI npm test, removed unused deps, prerender guard, sitemap
  XML escape, migration url naming, CSP header) -> commit 0a26034. All
  gates re-verified green.
- 2026-06-06 03:50 EDT - Branch pushed; consolidated draft PR #18 opened
  to dev (human chose one PR over per-phase due to phase dependencies +
  CI trigger config). Security items noted in PR for sign-off.

- 2026-06-06 12:30 EDT - Real assets (resume work, commits a304df1, d581b59,
  pushed to PR #18). 8 attraction photos sourced from Wikimedia Commons
  (CC0/CC BY/CC BY-SA), optimised to webp, attribution in
  src/data/image-credits.json rendered via getImageCredit on detail pages.
  Real FambulTik logo (PNG) wired into navbar + favicons; placeholder SVGs
  removed. All gates green (typecheck/lint/11 tests/build/prerender/axe 0).

- 2026-06-06 13:20 EDT - Copilot review on PR #18 addressed (commits 41a84d8
  delete static robots, b3f0cc2 code). 5 items: build-time robots.txt from
  VITE_SITE_URL, canonical-from-pathname on both 404 states, HoursBlock omits
  empty time range, JsonLd escapes "<". All gates green; resolution comment
  posted on PR #18.

- 2026-06-06 13:28 EDT - Second-round Copilot review on PR #18 addressed
  (commit 8cce695): supabase numeric coercion (rating Number()), NavBar
  StringKey typing (casts removed), Footer comment typo. All gates green;
  resolution comment posted.

- 2026-06-06 18:05 EDT - Vercel deploy fix. Project had Root Directory unset
  (framework null) -> built repo root -> 404. Added root vercel.json build
  shim + ADR 0003 (maintainer-authorised §12 deviation). rewrites `/(.*)` did
  not apply on framework=null; switched to legacy `routes` filesystem-handle
  config (headers in route). Verified on PR #33 preview: home/detail/about/
  signin/sitemap/image all 200. #33 merged to dev; promotion PR #19 ff'd to
  include it (c1414cc), preview 200s, all 4 CI gates green -> ready to merge.
  Detail pages client-rendered (npm run build, prerender deferred per ADR 0003).

## Outcomes

Duration: ~5:28 (02:48 -> 08:16 EDT, includes review wait).
Commits: 7   PRs opened: 1 (#18, draft)   Files changed: ~95
Token usage (this session, approx): out 761,250; cacheR 109,294,296; cost n/a.

Verification status (final): typecheck PASS, eslint --max-warnings 0 PASS,
vitest 11/11 PASS, build PASS (file+supabase), prerender PASS (10 routes),
axe smoke PASS (0 serious/critical x5), three-layer grep clean, secret scan
clean, prod npm audit 0 vulns.

Delivered SPEC Phases 1, 2, 3, 4, 5, 2.5 on branch issue-6-phases-1-5-build
(7 commits), draft PR #18 -> dev. All local gates green: typecheck, lint,
11 unit tests, build (file+supabase), prerender (10 routes, valid JSON-LD),
axe 0 serious/critical on 5 routes, three-layer grep clean, secret scan
clean, prod audit 0 vulns. ADR 0002 written (prerender swap + audit scope).

Escalated for human (per autonomous policy / stop-and-ask): §6.3 WITH CHECK
on UPDATE policies (non-exploitable), §5.3 lastReviewed column for supabase
attractions, Supabase query timeouts (Phase 6), Actions SHA pinning, ADR
0002 ratification, CSP validation on first deploy. Live infra (Vercel link,
Supabase provisioning, running the migration) requires human credentials.

Out of scope this run: Phase 6 auth wiring - /signin /signup are accessible
shells only.

## Next session

1. Human review + merge of PR #18 (dev). Decide on the flagged sign-off items
   (§6.3 WITH CHECK, §5.3 lastReviewed, SHA pinning, ADR 0002 ratification).
2. Provision live infra: Vercel root dir + build command (playwright install +
   build:prerender), Supabase project + schema, env vars. Then optional 2.5
   migration + flip VITE_ATTRACTIONS_SOURCE=supabase.
3. Phase 6 (auth + account): AuthProvider, ProtectedRoute, real sign-in/up
   handlers, bookmark/favorite/schedule, AccountPage. Re-add @radix-ui
   react-dialog/react-toast then.
4. Validate CSP on first deploy; add Supabase query timeouts with Phase 6.
