<!-- ADR: end-user review flagging (review_flags), a moderator role, and the
     moderator action mechanism. Resolves the Phase 9 follow-up deferred in
     ADR 0004 D2 (issue #50). -->

# ADR 0009: Review flagging + moderator role (issue #50)

- Status: Accepted (human-ratified 2026-06-07: profiles.role + hardened profiles policy; RLS moderator UPDATE + content-guard trigger; minimal /moderate UI; manual-only, auto-flag deferred)
- Date: 2026-06-07
- Traces to: issue #50; ADR 0004 D2 + follow-on; SPEC §6.6, §9, §15 P9, §19 step 41.
- Relates to: ADR 0005 (schema.sql <-> migrations convergence).

## Context

`public.reviews` (0001_reviews.sql) ships author-managed reviews: published-read
+ own-manage RLS, with the own-UPDATE hardened to
`using/with check (auth.uid()=user_id and status='published')` so an author
cannot edit or re-publish a taken-down review. Cross-user moderation is
operator-manual today (dashboard sets status). There is NO role mechanism in the
codebase; profiles (§6.3) is `id, display_name, created_at`, not publicly
readable. Issue #50 is the deferred self-serve follow-up: a signed-in user can
flag another's review; an operator can action flags in-app; RLS must still stop
non-authors editing review CONTENT (only status, only by a moderator).

## Decisions (all ratified)

### D1 - review_flags table (user-scoped, RLS in the same migration)
`public.review_flags (id, review_id -> reviews on delete cascade, user_id ->
auth.users on delete cascade, reason text check in
('spam','offensive','inaccurate','other'), created_at, unique(review_id,
user_id))`. RLS: INSERT `with check (auth.uid()=user_id and the review is not the
caller's own)`; SELECT/DELETE `using (auth.uid()=user_id)` (own rows only - this
keeps flag counts/flagger identity private); no UPDATE. reason VALUES are data;
their LABELS are content keys `reviews.flag.reason.*`.

### D2 - Moderator role: profiles.role + is_moderator(), with the profiles policy hardened
`alter table public.profiles add column role text not null default 'user' check
(role in ('user','moderator'))`. Helper `public.is_moderator()` (SQL, stable,
security definer) = exists a profiles row for auth.uid() with role='moderator'.
CRITICAL (§6.3 touch, ratified): the existing `"own profile update"` policy lets
a user PATCH their own row, so it MUST be hardened to pin role - a user may
update their profile but NOT change their own role. The pin is a
`guard_profile_role()` BEFORE UPDATE trigger comparing `new.role` to `old.role`
(raising when an authenticated user changes it), with the policy simplified to
`with check (auth.uid()=id)`. A self-referential `WITH CHECK` subquery
(`role = (select role ... where id=auth.uid())`) was REJECTED in review: within
the same statement it can read the post-update value and be bypassed; OLD/NEW in
a trigger are unambiguous (same pattern as `guard_review_content`). Assignment is
operator SQL (`update profiles set role='moderator' where id=...`; auth.uid() is
null for the service role, which the trigger permits), never self-serve. The
client reads its own profiles.role only to show/hide the moderation UI; the
server never trusts it.

### D3 - Moderator action: a second RLS UPDATE policy on reviews + a content-guard trigger
`create policy "moderator review status update" on public.reviews for update
using (public.is_moderator()) with check (public.is_moderator())`. Coexists with
the hardened author policy (permissive policies OR). An UPDATE policy cannot
scope columns, so a BEFORE UPDATE trigger `guard_review_content()` is the
load-bearing control: if `auth.uid() is distinct from old.user_id` (i.e. a
non-author / moderator) and body/rating/user_id/attraction_id changed -> raise.
Net: a moderator may set status (publish/flag/remove) on any row but can never
alter content; an author edits only their own published row. Chosen over an Edge
Function (no new service-role surface for an RLS-expressible change).

### D4 - Moderator read access: SECURITY DEFINER queue + gated RPC
A `moderation_queue` definer view (review_id, attraction_id, status, flag_count,
reasons, last_flagged_at) joining reviews+review_flags, exposed only through
`list_moderation_queue()` (security definer; raises 'forbidden' unless
is_moderator()). Plus a moderator reviews SELECT policy
`using (public.is_moderator())` so the queue can show non-published bodies. The
raw review_flags table stays own-row-only (D1).

### D5 - Auto-flag deferred (manual-only)
No auto-flag trigger. flagged already hides a review from the public list, so an
N-flag auto-set is an auto-takedown/brigading vector. All status transitions are
a deliberate moderator action. Auto-flag-for-attention is a future ADR.

### D6 - Client surface
FlagRepository (interface-first): `flag(reviewId, reason)`, `unflag(reviewId)`,
`hasFlagged(reviewId)`; moderation slice: `listQueue()`, `setStatus(reviewId,
status)`, `getRole()`. Types: FlagReason, NewFlag, ModerationItem, UserRole. UI:
a flag affordance + reason picker in ReviewList (signed-in, not own review); a
kebab-case `/moderate` route + ModeratePage gated on getRole()==='moderator'
with publish/flag/remove wired to setStatus. All copy via `reviews.flag.*` +
`moderation.*` content keys. §6.1 Attraction type untouched; reviews content
columns stay author-only.

### D7 - Contracts + layering
Migration 0005_review_flags.sql holds the table + its RLS + the role column + the
replaced profiles policy + is_moderator() + the moderator reviews UPDATE/SELECT
policies + guard_review_content() + the queue view + the RPC. schema.sql
converged in the same change (ADR 0005). New FlagRepository/types/keys + a
/moderate route. No Edge Function, no new env, no new dependency.

## Risks (mitigations)

- Role self-grant -> the hardened profiles policy pins role; cross-account test.
- Moderator editing content -> guard_review_content() trigger (the load-bearing
  control); tested across author + moderator.
- Two-writer confusion on reviews.status -> author policy stays status='published'
  hardened; moderator policy is_moderator()-only; the trigger is an independent
  backstop.
- Count/flagger leakage -> own-row-only SELECT on review_flags; counts only via
  the gated definer RPC.
- Flag-spam -> unique(review_id,user_id); self-flag excluded by the INSERT policy.
- SECURITY DEFINER over-exposure -> the RPC checks is_moderator() before returning.

## Alternatives considered
Edge Function moderation (rejected: needless service-role surface); custom claims
role (rejected: no in-repo assignment, stale revocation); separate moderators
table (rejected: profiles holds it); auto-flag ON (rejected: brigading); broad
review_flags read for moderators (rejected: leaks flaggers); reason as a PG enum
(rejected: text+check is cheaper to grow).

## Sequencing
content -> migration (schema+RLS+role+trigger+view+RPC) -> schema.sql convergence
-> types -> FlagRepository + moderation slice -> ReviewList flag UI -> /moderate
page -> cross-account RLS + unit tests -> live-infra (apply 0005; assign the
first moderator via operator SQL). Contracts bumped: review_flags table + RLS;
additive profiles.role + a hardened profiles policy (§6.3 touch); a second
reviews.status writer + content-guard trigger; FlagRepository/types/keys;
/moderate route. Unchanged: §6.1 Attraction type; reviews content columns.
