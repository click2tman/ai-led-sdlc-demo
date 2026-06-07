# ADR 0008: Phase 11 — Payments (Stripe tour deposit)

Status: Accepted (human-ratified 2026-06-07: Stripe Checkout; fixed $20 deposit; paid -> pending->confirmed, no email; TEST-only behind VITE_PAYMENTS_ENABLED, default off)
Date: 2026-06-07
Reviewers: @click2tman (human sign-off). Depends on ADR 0007 (Phase 10 Edge
Function infra) merging first; Phase 11 reuses its `_shared/` tier.

## Context

SPEC §19 Phase 11 (steps 45-49) and §20 Phase 11 require a tour-deposit payment
against an existing `tour_bookings` row, processed entirely server-side, with
the booking marked paid ONLY via a signature-verified Stripe webhook - never
from the client. §3 names Stripe (`@stripe/stripe-js` client + the Stripe SDK
server-side in Edge Functions) and assigns PCI scope to Stripe
Checkout/Elements. §6.3/§6.6 fix the `payments` table and `payment_status` enum.
§16 fixes `VITE_STRIPE_PUBLISHABLE_KEY` (client) and `STRIPE_SECRET_KEY` +
`STRIPE_WEBHOOK_SECRET` (Edge Function secrets, never VITE_). §17 requires the
disclaimer be revised before live mode.

What is true today:

- The `payments` table and `payment_status` enum ('requires_payment' | 'paid' |
  'refunded' | 'failed') are DEFINED in SPEC §6.3 but NOT YET migrated. The DDL
  is canonical: `id, user_id, booking_id, stripe_payment_intent_id (unique),
  amount_cents (check >= 0), currency (default 'usd'), status (default
  'requires_payment'), created_at`. RLS is enabled with a single own-row READ
  policy and deliberately NO client write policy - status is written only by the
  Edge Function via the service role.
- `tour_bookings` has `status booking_status` enum ('pending' | 'confirmed' |
  'cancelled'), default 'pending'. 'confirmed' is not client-reachable today.
  Phase 10 (ADR 0007) deferred any 'confirmed' email template.
- Edge Function infrastructure exists from Phase 10 under `supabase/functions/`:
  `_shared/auth.ts`, `_shared/types.ts`, `deno.json` (remote deps pinned exact),
  the `Deno.serve` + `env()` fail-fast glue, the service-role client, and the
  insert-before-act idempotency-via-unique-constraint precedent (`email_log`).
  Phase 11 REUSES this tier; it does not re-invent it.
- `src/lib/account/bookings.ts` runs client-side with the user's JWT under RLS.
  `ScheduleTourModal.tsx` opens the dialog and inserts a booking. No payment
  surface yet. `src/lib/supabase.ts` reads only VITE_ anon config with fail-fast
  presence checks; the service-role key never enters the client.

Forces: money correctness (server-computed, tamper-proof amount); PCI (no card
data in our code/DB); webhook trust (status written only after Stripe-signature
verification); idempotency + ordering within the FIXED `payments` schema (no
`stripe_event_id` column available); three-layer separation (amounts are
config/data, not copy); contract stability (the §6.3 DDL and §6.1 type must not
diverge; any `tour_bookings` change is additive); 80/20 (code vs Stripe
account/secrets/deploy/webhook-registration/legal).

## Decision

Add two Edge Functions (`create-checkout`, `stripe-webhook`) and one additive
migration that applies the §6.3 `payments` DDL verbatim, wire a "Pay deposit
(test)" affordance into the Schedule-a-Tour flow that opens Stripe-hosted
Checkout, and mark the booking paid only from the signature-verified webhook.
The deposit is a server-computed fixed $20 (2000 cents). The build ships in
Stripe TEST mode, gated by `VITE_PAYMENTS_ENABLED` (default off); no live mode
until the §17 disclaimer is revised (legal sign-off).

### D1 - Stripe Checkout (hosted redirect), not Elements

`create-checkout` creates a Checkout Session and returns its `url`; the client
redirects to it. Card data never enters our origin (smallest PCI scope, SAQ A;
no card-handling code). Return URLs are SPA routes
(`/account?tour=paid&session_id={CHECKOUT_SESSION_ID}` success;
`/account?tour=cancelled` cancel). The redirect param is COSMETIC only - the
authoritative paid state always comes from the webhook + a `payments` read,
never the (user-forgeable) redirect.

### D2 - Two Edge Functions with DIFFERENT inbound auth

- `create-checkout` authenticates the USER: requires the caller's Supabase JWT
  (forwarded via `supabase.functions.invoke`), resolves `auth.uid()`, verifies
  the user OWNS the `booking_id`, computes the amount server-side (D3), upserts a
  `payments` row in 'requires_payment', creates the Checkout Session with
  `metadata: { booking_id, user_id, payment_id }`, persists the `payment_intent`
  id, returns the session `url`. Holds `STRIPE_SECRET_KEY`.
- `stripe-webhook` authenticates STRIPE, not a shared header secret. It reads the
  RAW body + `stripe-signature` header and calls
  `constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET)`; invalid signature ->
  400 and no DB write. The body MUST NOT be JSON-parsed before verification
  (re-serialising breaks the HMAC). This DIFFERS from the Phase 10
  `x-webhook-secret` shared-secret pattern - do not copy it. The Stripe Deno SDK
  is pinned in `deno.json`.

### D3 - Server-computed fixed deposit (anti-tamper), as config/data

`amount_cents` is computed by `create-checkout`, never accepted from the client
(the request carries only `booking_id`). A fixed `DEPOSIT_AMOUNT_CENTS = 2000`
($20) constant lives in a config/data module, NOT `strings.en.json` (amounts are
facts, not copy). Currency stays the §6.3 default 'usd'.

### D4 - payments <-> tour_bookings linkage and the booking transition

On the authoritative paid event the webhook sets `payments.status='paid'` AND
transitions the booking `pending -> confirmed` (the existing enum value, service
role). Preferred over adding a `paid` column because it reuses the existing
enum and keeps the change purely additive (`payments` table only). Phase 10's
deferred confirmation email stays deferred (ratified: no email on this
transition for now).

### D5 - Authoritative event, idempotency, ordering within the FIXED schema

The §6.3 table has NO `stripe_event_id` column and must not gain one.
Idempotency keys on the existing `stripe_payment_intent_id UNIQUE` + a status
guard. Authoritative paid event: `checkout.session.completed` with
`payment_status='paid'`. Mark-paid is a conditional UPDATE:
`update payments set status='paid' where stripe_payment_intent_id=<intent> and
status<>'paid'`; a duplicate/out-of-order delivery finding it already 'paid' is
a no-op. The booking transition is guarded (`... where id=<booking_id> and
status='pending'`) so re-delivery cannot clobber a later 'cancelled'. Webhook
returns 2xx after verify+write (and on already-paid no-op); non-2xx only on
signature failure or unexpected error. `failed` set from
`payment_intent.payment_failed`/`checkout.session.expired` under the same
discipline. `refunded` out of scope (enum value kept).

### D6 - Migration: apply §6.3 payments DDL verbatim, RLS in the same file

`supabase/migrations/0004_payments.sql` = enum + table + own-row READ policy +
`enable row level security`, verbatim from §6.3. No client write policy.
`supabase/schema.sql` updated in the same change so fresh-apply and incremental
migrate converge (ADR 0005). Additive: §6.3 tables and the §6.1 type untouched.

### D7 - Client surface: typed PaymentRepository + content keys

Define the `PaymentRepository` interface first (api-conventions):
`startCheckout(bookingId): Promise<{ url }>` (wraps
`functions.invoke('create-checkout')`) and `getForBooking(bookingId):
Promise<Payment | null>` (own-row READ via RLS). No component reads the table
directly. `ScheduleTourModal.tsx` gains a "Pay deposit (test)" affordance after
a booking is created, behind `VITE_PAYMENTS_ENABLED`, with labels from new
`payment.*` keys (amounts are NOT copy). `VITE_STRIPE_PUBLISHABLE_KEY` is read
with the same fail-fast presence check as `isSupabaseConfigured()`; the redirect
uses `@stripe/stripe-js`.

### D8 - TEST mode, env flag, and the disclaimer

Ships in Stripe TEST mode behind `VITE_PAYMENTS_ENABLED` (default off). The §17
disclaimer and `schedule.modal.description` ("No payment is taken") remain
ACCURATE in TEST mode (test cards, no real charge) and may stay. Before ANY live
mode they MUST be revised (real payments, terms, refund policy) - a human legal
sign-off, not an agent decision.

## Consequences

Positive: no card data in our origin/DB (Checkout, SAQ A); amount server-computed
and paid-state HMAC-verified, neither client-trustable; migration applies §6.3
verbatim (no divergence); reuses ADR 0007 `_shared/` infra. Negative: two Edge
Functions + three Stripe env/secrets + an env flag; the Stripe webhook endpoint
and signing secret are dashboard-registered (runbook, not VCS); `confirmed` now
has a webhook writer; `@stripe/stripe-js` + a pinned Stripe Deno SDK are new
deps. Follow-on: refund flow; the deferred booking-confirmed email; per-attraction
pricing; the live-mode disclaimer/terms revision (legal).

## Alternatives considered

Elements (rejected: PCI + card-handling surface the deposit does not need);
client-computed amount (rejected: tamperable); adding `stripe_event_id`/a `paid`
column (rejected: diverges the fixed §6.3 schema needlessly); trusting the
`success_url` redirect (rejected: user-forgeable); reusing the Phase 10
shared-secret for the Stripe webhook (rejected: Stripe uses HMAC over the raw
body); amounts in `strings.en.json` (rejected: three-layer rule).

## Stop-and-ask flags (ratified 2026-06-07)

1. Checkout vs Elements -> **Checkout**.
2. Deposit amount -> **fixed $20 (2000 cents), config/data**.
3. tour_bookings transition on paid -> **pending->confirmed, NO email**.
4. Disclaimer/live mode -> **TEST-only behind `VITE_PAYMENTS_ENABLED` (default
   off)**; live-mode disclaimer is a later legal sign-off.
5. New deps -> **`@stripe/stripe-js` (client, §3) + pinned Stripe Deno SDK**.

## Sequencing plan

content -> config/data -> migration+schema -> repository contract -> functions
(create-checkout, stripe-webhook) -> client wiring -> tests -> live-infra. Code
is deliverable; the Stripe account/test keys, the three env/secrets, function
deploy, webhook-endpoint registration, and the live-mode legal sign-off are
human/live-infra. Contracts bumped: additive `payments` table + enum (migration
0004, RLS in-file); new `PaymentRepository` + `Payment` type; new `payment.*`
keys; new env (`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_PAYMENTS_ENABLED`, + two
function secrets). Unchanged: `Attraction` type; `tour_bookings` columns.
