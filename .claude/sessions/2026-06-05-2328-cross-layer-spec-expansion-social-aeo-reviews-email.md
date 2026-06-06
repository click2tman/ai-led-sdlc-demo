---
id: 2026-06-05-2328-cross-layer-spec-expansion-social-aeo-reviews-email
layer: cross-layer
issue: none
context_pack: none
started: 2026-06-05 23:28 EDT
ended: 2026-06-06 00:00 EDT
author: Tamba S Lamin
actor: claude
branch: dev
---

# Session: spec-expansion-social-aeo-reviews-email

## Overview
Expand SPEC.md to add five owner-requested capabilities while preserving
the in-class teaching framing (decision: "extend the demo with new
phases"). Touches SPEC sections 2, 3, 6, 9, 13, 15, 16, 17, 19, 21.
Per spec-first, the SPEC is the source of truth and is itself the
traceable artefact for the follow-on GitHub issues to be drafted into
project users/click2tman/projects/3.

## Goals
- [ ] AEO added to SEO/GEO (new section 13.3; delivered in Phase 3 - static foundation)
- [ ] Social login (Google, Facebook, LinkedIn) added to the auth phase (Phase 6) alongside email/password
- [ ] Real-time reviews specified as a new post-class phase (schema + RLS + Realtime + moderation)
- [ ] Email notifications specified as a new phase (Supabase Edge Functions + email provider)
- [ ] Stripe payments specified as a new phase (Edge Functions, webhooks, PCI posture)
- [ ] Server compute decision recorded: Supabase Edge Functions
- [ ] Disclaimer (section 17) kept verbatim, with a caveat noting the payments phase requires a revision
- [ ] Draft one GitHub issue per feature into project 3, referencing the new SPEC sections

## Plan
Owner decisions (AskUserQuestion, 2026-06-05):
1. Framing: extend the demo with new phases (keep teaching framing + disclaimer).
2. Social login: into existing auth phase (Phase 6) alongside email/password.
3. Server compute for Stripe + email: Supabase Edge Functions.
4. Tracking: also draft GitHub issues into project 3 after the SPEC edit.

Surgical, additive edits only. Existing Phase 2 schema (section 6.3) left
intact; new tables added in a clearly-marked future-phase block. New
phases numbered 9 (reviews), 10 (email), 11 (payments).

## Updates

### 2026-06-05 23:40 EDT - SPEC.md edits complete
Edited SPEC.md (additive, surgical):
- 2: AEO into Phase 1 scope; social login into Phase 2 scope; converted
  the "Out of scope" list into a new "Phase 9+ - Production extensions"
  block (reviews/email/payments) + a trimmed out-of-scope list.
- 3: added Auth providers (P6), Realtime (P9), Server compute / Supabase
  Edge Functions (P10/P11), Email (P10), Payments / Stripe (P11) rows.
- 6.6 (new): draft reviews + payments tables with RLS; 6.3 left intact.
- 9.3 reviews UI, 9.4 Stripe deposit, 9.6 social sign-in buttons.
- 13.3 (new): AEO section. 14.1: Review + SpeakableSpecification entities.
- 15: security bullets for OAuth redirect, review moderation, Edge
  Function secrets, Stripe webhook verification.
- 16: VITE_STRIPE_PUBLISHABLE_KEY + Edge Function secret notes.
- 17: disclaimer kept verbatim + Phase 11 caveat.
- 19: AEO folded into Phase 3 step 14; OAuth providers in Phase 5 step
  25; SocialSignInButtons in Phase 6 step 29; new Phases 9/10/11
  (steps 38-49). No downstream renumber churn.
- 20: acceptance criteria for Phases 6/9/10/11.
- 22: payment-gateway guardrail scoped to Phases 1-8; added secret +
  payments-write guardrails.
Verified no residual scope/payment contradictions beyond the intentional
disclaimer + scoped guardrail.

### 2026-06-05 23:58 EDT - README mirrored + full backlog created
- README.md updated to mirror the latest SPEC: intro (AEO), disclaimer
  Phase-11 caveat, Features (social login + Phases 9-11), Tech Stack
  rows, env vars, SEO/AEO/GEO section + ToC, JSON-LD entities, security,
  Supabase backend (OAuth + reviews/payments tables), acceptance criteria.
- Created baseline build-phase issues #6-#13:
  - #6 Phase 1 Scaffold, #7 Phase 2 Data/content/repository,
    #8 Phase 3 SEO/JSON-LD/brand/UI/a11y, #9 Phase 4 CI+Deploy,
    #10 Phase 5 Supabase provisioning, #11 Phase 6 Auth+account,
    #12 Phase 7 Ship v2, #13 Phase 2.5 migrate attractions.
- Full backlog = #1-#13. Phase 8 (Payload CMS) intentionally not
  created: SPEC marks it out of scope for the class.
- Clarified to user: GitHub issue numbers (#1-5) != SPEC phase numbers;
  nothing was skipped.

### Update - 2026-06-05 23:50 EDT

Summary: All 13 issues (#1-#13) confirmed linked to click2tman project 3
"SLINT AI-LED SDLC". Prior blocker was misdiagnosed as token scope; the
real cause was account ownership. Project 3 belongs to user click2tman
while gh is authenticated as tamba-lamin-tpgroup, so the board was
invisible/unwritable from this account. Resolved after click2tman shared
project access. Final goal (one issue per feature into project 3) done.

Git:
  branch: dev
  last-commit: bb8ea32 docs: sync README with expanded SPEC (social, AEO, reviews, email, Stripe)
  staged: 0   modified: 0   untracked: 0
  files-touched-since-last-update:
    - (none - GitHub project linkage only, no repo files)

Tasks (TaskList):
  completed: 0   in-progress: 0   pending: 0
  just-completed:
    - Link all 13 issues to project 3

Verification:
  last-run: not run since last commit
  status: skipped

Notes:
  - gh token now carries the 'project' scope, but scope was never the
    blocker. ProjectV2s owned by a user are not listable/writable from a
    different authenticated account unless explicitly shared.
  - Project 3 = "SLINT AI-LED SDLC" (id PVT_kwHOABJPh84BZ3GD), 13 items,
    all matching issues #1-#13. No duplicates created on retry.

## Findings
- ProjectV2 ownership gotcha: a token with the 'project' scope is
  necessary but not sufficient. A user-owned project (click2tman) is
  invisible to a different authenticated account (tamba-lamin-tpgroup)
  until the owner shares it. GraphQL returns empty nodes rather than a
  permission error, which is what made it look like a scope problem.
- SPEC section 2 "Out of scope (all phases)" currently lists exactly the
  three features being added (payments, real-time reviews, email/SMS).
  These move into new Phase 9+ scope rather than staying out of scope.
- Stripe payments contradict the section 17 disclaimer ("No payments or
  real bookings are processed"). Owner chose to keep the disclaimer
  intact for the demo; flag that the payments phase must revise it.

### 2026-06-05 23:46 EDT - committed + issues drafted
- SPEC commit 54d20b2 pushed to origin/dev.
- Drafted 5 issues on click2tman/ai-led-sdlc-demo:
  - #1 Phase 6: Social login (Google, Facebook, LinkedIn)
  - #2 Phase 3: AEO
  - #3 Phase 9: Real-time reviews
  - #4 Phase 10: Email notifications
  - #5 Phase 11: Payments (Stripe)

## Open questions
- [RESOLVED 2026-06-05] Issues NOT yet added to users/click2tman/projects/3.
  Original diagnosis (missing 'project' scope) was wrong. Real cause:
  project 3 is owned by click2tman, gh authed as tamba-lamin-tpgroup.
  Fixed by click2tman sharing project access. All 13 issues now linked.
- Branch policy: SPEC change committed directly to dev (pre-scaffold, no
  CI to gate a PR; matches the harness-commit precedent). Once the app is
  scaffolded, route SPEC/feature changes through a branch + PR per
  branch-conventions.

## Outcomes

Duration: ~0:32 (23:28 -> 00:00 EDT, active window; board-linkage work
spanned later in the evening)
Commits: 2 (SPEC + README) PRs opened: 0 Files changed: 2 (SPEC.md, README.md)
Token usage (this session, approx; filtered by date 2026-06-05, not exact
session boundary): total 24,645,640 (in:46,647 out:268,006
cacheW:573,778 cacheR:23,757,209) cost:n/a

Goals reached:
  - [x] AEO added to SEO/GEO (new section 13.3; Phase 3 step 14) (23:40)
  - [x] Social login into Phase 6 alongside email/password (23:40)
  - [x] Real-time reviews as new Phase 9 (schema + RLS + Realtime + moderation) (23:40)
  - [x] Email notifications as new Phase 10 (Edge Functions + provider) (23:40)
  - [x] Stripe payments as new Phase 11 (Edge Functions, webhooks, PCI) (23:40)
  - [x] Server compute decision recorded: Supabase Edge Functions (23:40)
  - [x] Disclaimer kept verbatim + Phase 11 revision caveat (23:40)
  - [x] One issue per feature drafted; full backlog #1-#13 linked to project 3 (23:50)

Key accomplishments:
  - SPEC.md expanded surgically/additively across sections 2, 3, 6.6,
    9, 13.3, 14.1, 15, 16, 17, 19, 20, 22. No downstream renumber churn.
  - README mirrored to the expanded SPEC.
  - Full GitHub backlog (#1-#13) created and linked to click2tman
    project 3 "SLINT AI-LED SDLC".

Code changes:
  - SPEC.md - five new capabilities, three new phases (9/10/11).
  - README.md - public mirror of the above.
  - (no application source; repo is still pre-scaffold.)

Decisions made:
  - Framing: extend the demo with new phases, keep teaching framing.
  - Social login folded into existing Phase 6, not a new phase.
  - Server compute for Stripe + email: Supabase Edge Functions.
  - Disclaimer kept verbatim for the demo; Phase 11 must revise it.

Findings worth carrying:
  - ProjectV2 ownership gotcha: a 'project'-scoped token is necessary
    but not sufficient. A user-owned project (click2tman) is invisible
    to a different authenticated account (tamba-lamin-tpgroup) until the
    owner shares it. GraphQL returns empty nodes, not a permission error.
  - Stripe payments contradict the section 17 disclaimer; Phase 11 must
    revise it before shipping payments.
  - SPEC was committed directly to dev (pre-scaffold, no CI to gate a
    PR). Once scaffolded, route SPEC/feature changes through branch + PR.

Verification status (final):
  Not run. The verification loop (lint, typecheck, build, secret scan)
  depends on package.json, which does not exist until Phase 1 scaffold.
  This session changed only SPEC.md and README.md (docs), so the loop is
  not applicable. Secret scan not required for prose-only edits.

## Next session

Pick up by reading:
  - This session file (Outcomes + Findings above)
  - SPEC.md (the expanded source of truth)
  - GitHub backlog #1-#13 on click2tman project 3

Concrete next steps:
  1. Begin the architecture-documentation deliverable (new session):
     business, development, infrastructure, platform, application,
     runtime architectures + AI-led SDLC tooling, testing, security,
     all traced to SPEC.md.
  2. When ready to build, /orchestrate the Phase 1 scaffold issue (#6).

Unresolved blockers:
  - None. All goals satisfied.
  - Carry-forward policy note: once the app is scaffolded, SPEC/feature
    changes route through a branch + PR per branch-conventions, not a
    direct dev commit.

Recommended starting command:
  /session-start (architecture documentation) OR
  /orchestrate <Phase-1-scaffold issue #6 url>
