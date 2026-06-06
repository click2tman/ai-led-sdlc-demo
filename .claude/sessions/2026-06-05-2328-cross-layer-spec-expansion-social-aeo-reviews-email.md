---
id: 2026-06-05-2328-cross-layer-spec-expansion-social-aeo-reviews-email
layer: cross-layer
issue: none
context_pack: none
started: 2026-06-05 23:28 EDT
ended: in-progress
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

## Findings
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
- Issues NOT yet added to users/click2tman/projects/3: gh token lacks the
  project scope. User must run `gh auth refresh -s project` (interactive),
  then add items (see Next session).
- Branch policy: SPEC change committed directly to dev (pre-scaffold, no
  CI to gate a PR; matches the harness-commit precedent). Once the app is
  scaffolded, route SPEC/feature changes through a branch + PR per
  branch-conventions.

## Outcomes

## Next session
