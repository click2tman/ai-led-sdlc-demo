---
id: 2026-06-07-review-moderation
layer: cross-layer
issue: #50
context_pack: none
started: 2026-06-07 21:30 EDT
ended: 2026-06-08 09:50 EDT
author: Tamba S Lamin
actor: claude-autonomous
branch: issue-50-review-moderation
---

# Session: review-moderation

## Overview
Issue #50 (Phase 9 follow-up) per ratified ADR 0009: end-user review flagging +
a moderator role. review_flags table (RLS own-row only), profiles.role +
hardened profiles policy (no self-escalation), a moderator reviews UPDATE policy
+ a content-guard trigger (moderators change ONLY status, never body/rating),
a gated moderation_queue RPC, a flag affordance in ReviewList, and a role-gated
/moderate page. Manual-only (auto-flag deferred). Branched off issue-5-payments.

## Goals
- [x] migration 0005_review_flags.sql (table+RLS, role, hardened policy, mod
      policy, guard trigger, queue view + RPC)
- [x] content reviews.flag.* + moderation.* keys
- [x] FlagRepository + types + barrel
- [x] ReviewList flag affordance; /moderate page + route
- [ ] security + code review; PR to dev

## Plan
ADR 0009 sequence. The guard_review_content trigger is the load-bearing control.
RLS/trigger validation is live-infra (needs Postgres) - the dedicated RLS
integration test is issue #39.

## Updates
- 2026-06-07 22:30 EDT - Built #50. Migration 0005 (review_flags + own-row RLS;
  profiles.role + is_moderator(); hardened profiles own-update to pin role;
  moderator reviews UPDATE + SELECT policies; guard_review_content() BEFORE
  UPDATE trigger; moderation_queue view + list_moderation_queue() definer RPC
  gated on is_moderator()). Content keys. Types (FlagReason/NewFlag/
  ModerationItem/UserRole). FlagRepository (flag/unflag/hasFlagged/getRole/
  listQueue/setStatus) + barrel. ReviewList FlagButton (signed-in, non-author,
  reason picker, idempotent). ModeratePage role-gated + /moderate route
  (ProtectedRoute, excluded from prerender). Verified: typecheck, lint, 70
  tests, build, a11y 5/5.

### Update - 2026-06-08 09:45 EDT

Summary: Fixed Copilot review comments across all three stacked PRs (#59 email,
#60 payments, #61 moderation) on their respective branches; resolved all threads.

Git:
  branch: issue-50-review-moderation
  last-commit: 89b3772 docs: align ADR 0009 D2 with the shipped trigger role-pin
  staged: 0   modified: 0   untracked: 1
  files-touched-since-last-update:
    - docs/adr/0009-review-flagging-moderation.md            (#61, issue-50 branch)
    - salone-explorer/src/pages/AccountPage.tsx              (#60, issue-5 branch)
    - salone-explorer/supabase/functions/stripe-webhook/index.ts (#60)
    - docs/adr/0007-phase-10-email.md                        (#59, issue-4 branch)
    - salone-explorer/supabase/functions/booking-email/index.ts  (#59)
    - .github/workflows/ci.yml                               (#59: new deno-check job)

Tasks (TaskList):
  completed: 0   in-progress: 0   pending: 0
  just-completed:
    - Resolve Copilot comments on #59/#60/#61

Verification:
  last-run: 2026-06-08 09:40 EDT
  status: pass

Notes:
  - #61: ADR 0009 D2 aligned to the shipped guard_profile_role() trigger (the
    self-referential WITH CHECK subquery was rejected in review as bypassable).
  - #60: AccountPage builds a fresh URLSearchParams before delete; stripe-webhook
    captures + throws PostgREST errors on all 3 writes (paid/confirmed/failed)
    so Stripe retries; booking-confirm runs on every paid delivery (guarded) so
    a retry recovers a half-applied state.
  - #59: ADR 0007 D4 corrected to send({to,subject,text}); releaseClaim logs a
    failed delete; added a deno-check CI job.
  - The new deno-check job caught a REAL type error (releaseClaim param typed
    ReturnType<typeof createClient> -> wrong generics); fixed to SupabaseClient.
    Installed deno 2.8 locally to validate; create-checkout + stripe-webhook
    also pass deno check.
  - Stacked-merge order unchanged: #59 -> #60 -> #61. The deno-check job lives on
    #59's ci.yml; it propagates to #60/#61 on rebase after #59 merges (which also
    brings the booking-email fix, so they won't fail deno-check then).
  - Stray untracked salone-explorer/supabase/functions/deno.lock from the local
    deno check run; not committed on this branch.

## Findings
- schema.sql convergence (ADR D7) does NOT apply: review_flags + the moderator
  policies depend on the reviews table, which is migration-only (0001 never
  added reviews to schema.sql; same for email_log). Converging would require
  backfilling reviews/email_log into schema.sql first (out of scope for #50), so
  0005 is migration-only, matching the reviews/email_log precedent.
- The guard_review_content trigger also blocks the service role (auth.uid()
  null) from editing review content - a stronger guarantee than required; no
  legitimate service-role review-content edit exists.
- Until the new deno-check CI job (#59), NOTHING validated the Deno Edge
  Functions: they are excluded from the app tsc + eslint and only run at deploy.
  deno check (deno 2.8, --config supabase/functions/deno.json) immediately found
  a type error (helper param ReturnType<typeof createClient> infers wrong
  generics; use SupabaseClient). Worth keeping deno-check as a standing gate for
  every function-touching change.

## Open questions

## Outcomes
Duration: ~12:20 (spans overnight; ~1h30 active: #50 build + cross-PR Copilot fixes)
Commits: 4 on issue-50 (+2 on issue-4/issue-5 branches for Copilot fixes)   PRs opened: 1 (#61)   Files changed: ~18
Token usage (this session, approx, --since 2026-06-07): total 344,788,062
  (in:71,058 out:586,295 cacheW:4,957,028 cacheR:339,173,681) cost:n/a

Goals reached:
  - [x] migration 0005_review_flags.sql - table+RLS, role, hardened policy, mod
        policy, content-guard trigger, queue view + RPC (Update 22:30)
  - [x] content reviews.flag.* + moderation.* keys (22:30)
  - [x] FlagRepository + types + barrel (22:30)
  - [x] ReviewList flag affordance; /moderate page + route (22:30)
  - [x] security + code review; PR to dev (Update 09:45 - all findings fixed)
  - [x] Copilot comments on #59/#60/#61 fixed + threads resolved (09:45)

Key accomplishments:
  - Shipped end-user review flagging + an in-app moderator role/queue (#50).
  - Caught + fixed a HIGH privilege-escalation (role self-grant) in review:
    self-referential WITH CHECK subquery -> guard_profile_role() trigger.
  - Added a deno-check CI job that validates the Deno Edge Functions for the
    first time; it caught a real type error.
  - #59 (email), #60 (payments), #61 (moderation) all MERGED to dev.

Code changes:
  - supabase/migrations/0005_review_flags.sql (new; the security boundary)
  - src/lib/account/{flags.ts (new),types.ts,index.ts}
  - src/components/ReviewList.tsx (FlagButton); src/pages/ModeratePage.tsx (new); routes.tsx
  - src/content/strings.en.json (reviews.flag.* + moderation.*)
  - tests/lib/moderation.test.ts (new)
  - (#60) src/pages/AccountPage.tsx; supabase/functions/stripe-webhook/index.ts
  - (#59) supabase/functions/booking-email/index.ts; .github/workflows/ci.yml (deno-check); docs/adr/0007
  - docs/adr/0009-review-flagging-moderation.md (new)

Decisions made:
  - ADR 0009 (Accepted): profiles.role + trigger-pinned no-self-escalation; RLS
    moderator UPDATE + content-guard trigger; minimal /moderate UI; manual-only.
  - Webhook DB-write failures now throw -> Stripe retries (idempotent updates).
  - deno-check is a standing gate for function-touching changes.

Findings worth carrying:
  - schema.sql convergence (ADR 0009 D7) N/A here: 0005 extends the
    migration-only reviews table; full backfill of reviews/email_log/review_flags
    is a tracked hygiene follow-up.
  - guard_review_content also blocks the service role from editing review content
    (stronger than required; no legitimate service-role content edit exists).
  - The Deno Edge Functions had NO CI validation before deno-check (#59).

Verification status (final):
  lint: clean (eslint --max-warnings 0)
  typecheck: clean (tsc --noEmit)
  build: pass
  73 unit tests pass; a11y 5/5 (run at 22:30 + 09:40)
  deno check: create-checkout + stripe-webhook + (fixed) booking-email pass

## Next session
Pick up by reading:
  - This session file (Outcomes + Findings)
  - ADR 0009 (moderation), ADR 0007/0008 (email/payments) for the Edge Function patterns

Concrete next steps:
  1. Reviews follow-ups: #51 named reviews (privacy/display-name ADR), #52
     redeploy-on-volume hook (Vercel deploy hook + cadence).
  2. #39 RLS integration test - would validate the 0005 policies/trigger against
     a live Postgres (the moderation security boundary is otherwise CI-unvalidated).
  3. schema.sql full convergence (backfill reviews/email_log/review_flags).
  4. dev -> main promotion to ship React 19 + dep modernization + email +
     payments + moderation to production.

Unresolved blockers:
  - None. (eslint 10 #32 remains blocked upstream on eslint-plugin-jsx-a11y.)

Recommended starting command:
  /session-start #51   (or /orchestrate <#51 issue url>)
