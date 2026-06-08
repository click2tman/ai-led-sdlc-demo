---
id: 2026-06-07-payments-phase-11
layer: cross-layer
issue: #5
context_pack: none
started: 2026-06-07 18:10 EDT
ended: 2026-06-07 18:50 EDT
author: Tamba S Lamin
actor: claude-autonomous
branch: issue-5-payments
---

# Session: payments-phase-11

## Overview
Phase 11 (issue #5) per ratified ADR 0008: Stripe tour-deposit (fixed $20,
TEST mode behind VITE_PAYMENTS_ENABLED). create-checkout Edge Function (user
JWT + booking ownership, server-computed amount) + stripe-webhook (HMAC
signature over raw body, conditional-update paid -> booking pending->confirmed,
no email). payments table migration 0004 (verbatim §6.3, RLS own-row read, no
client write). Reuses Phase 10 _shared/ infra; branched off issue-4-email.

## Goals
- [x] migration 0004_payments.sql + schema.sql convergence
- [x] payment.* content keys; server-side deposit config (not content)
- [x] PaymentRepository + Payment type + barrel; client payments.ts (stripe-js)
- [x] create-checkout + stripe-webhook functions; stripe pinned in deno.json
- [x] ScheduleTourModal deposit step (gated); @stripe/stripe-js dep
- [x] tests (stripe-events classifier); gates green
- [ ] security + code review; PR to dev

## Plan
ADR 0008 sequence. Pure logic (_shared/stripe-events, payments-config) tested by
vitest; Deno glue eslint-ignored. Webhook auth = Stripe signature (NOT the Phase
10 shared-secret). Amount server-computed (anti-tamper). Paid state only from the
verified webhook (redirect param cosmetic).

## Updates
- 2026-06-07 18:36 EDT - Built Phase 11. Migration 0004 + schema.sql payments
  block. content payment.* keys; _shared/payments-config.ts (DEPOSIT_AMOUNT_CENTS
  =2000). _shared/stripe-events.ts (pure classifier). create-checkout/index.ts
  (user JWT auth, RLS ownership read, service-role payments insert, Stripe
  Checkout Session, persists payment_intent). stripe-webhook/index.ts
  (constructEventAsync over raw body, status-guarded conditional updates,
  pending->confirmed). deno.json pins stripe@17.7.0. PaymentRepository +
  Payment type + barrel; client lib/payments.ts (isPaymentsEnabled + getStripe).
  ScheduleTourModal optional deposit step behind isPaymentsEnabled().
  @stripe/stripe-js@7. Verified: typecheck, lint, 68 tests (6 new), build, a11y
  5/5, no secret in bundle, no hardcoded amounts in client code.

## Findings
- The Stripe webhook MUST verify the HMAC signature over the RAW body before
  parsing (re-serialising breaks the signature) - deliberately different from
  the Phase 10 x-webhook-secret header pattern.
- Idempotency uses the existing stripe_payment_intent_id UNIQUE + status-guarded
  conditional UPDATE (no schema column added; §6.3 fixed).

## Open questions

## Outcomes
Phase 11 Stripe deposit shipped per ADR 0008: create-checkout + stripe-webhook
Edge Functions, payments table (migration 0004, RLS, no client write, partial
unique index), client repository + gated deposit step, TEST-mode behind
VITE_PAYMENTS_ENABLED. security + code review findings all addressed (no
blockers; race/double-session/a11y/redirect-toast hardening). PR #60 -> dev.
Closes #5. Live-infra (Stripe keys/secrets, deploy, webhook registration,
migration; live-mode disclaimer) documented.

## Next session
Live-infra to activate payments (human). Remaining: reviews follow-ups
#50/#51/#52, #39 RLS integration test, eslint 10 (#32, blocked on jsx-a11y). A
dev->main promotion would ship React 19 + deps + email (#59) + payments (#60).
