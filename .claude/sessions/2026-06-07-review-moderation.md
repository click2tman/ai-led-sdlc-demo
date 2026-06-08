---
id: 2026-06-07-review-moderation
layer: cross-layer
issue: #50
context_pack: none
started: 2026-06-07 21:30 EDT
ended: 2026-06-07 22:30 EDT
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

## Findings
- schema.sql convergence (ADR D7) does NOT apply: review_flags + the moderator
  policies depend on the reviews table, which is migration-only (0001 never
  added reviews to schema.sql; same for email_log). Converging would require
  backfilling reviews/email_log into schema.sql first (out of scope for #50), so
  0005 is migration-only, matching the reviews/email_log precedent.
- The guard_review_content trigger also blocks the service role (auth.uid()
  null) from editing review content - a stronger guarantee than required; no
  legitimate service-role review-content edit exists.

## Open questions

## Outcomes
Review flagging + moderator role shipped per ADR 0009: review_flags (RLS own-row),
profiles.role + trigger-pinned no-self-escalation, moderator reviews UPDATE policy
+ content-guard trigger, gated moderation_queue RPC, ReviewList flag affordance,
role-gated /moderate page. security + code review findings all addressed (1 HIGH
self-escalation fixed via a trigger + mediums/code). PR -> dev. Closes #50.
Live-infra: apply 0005; assign a moderator via operator SQL.

## Next session
Remaining reviews follow-ups: #51 named reviews, #52 redeploy hook. #39 RLS
integration test (would validate the 0005 policies/trigger). schema.sql full
convergence (backfill reviews/email_log/review_flags) - hygiene follow-up. A
dev->main promotion would ship React 19 + deps + email + payments + moderation.
