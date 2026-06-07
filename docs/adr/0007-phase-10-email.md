# ADR 0007: Phase 10 — Transactional email on booking create/cancel

Status: Accepted (human-ratified 2026-06-07: Resend; DB Webhook; email_log table; checked-in copy snapshot + CI drift gate)
Date: 2026-06-07
Reviewers: @click2tman (human sign-off required — author may not approve own ADR)

## Context

SPEC §19 Phase 10 (steps 42–44) and §20 Phase 10 require Salone Explorer
to send a transactional email when a tour booking is created or cancelled
(optionally on a new review), with the email-provider API key existing
*only* as a Supabase Edge Function secret and no PII beyond what the
message needs reaching the client. §3 names Supabase Edge Functions (Deno)
as the server-compute tier and a transactional provider (e.g. Resend) for
email. §16 fixes `EMAIL_PROVIDER_API_KEY` as an Edge Function secret, never
`VITE_`-prefixed. §15 reiterates the secret boundary.

What is true today:

- Bookings are user-scoped rows in `public.tour_bookings` (§6.3 /
  `supabase/schema.sql`) under RLS (`auth.uid() = user_id`). Columns:
  `id, user_id, attraction_id, tour_date, party_size, notes, status,
  created_at`. There is **no email column**; the recipient is
  `auth.users.email`.
- `status` is an enum `('pending','confirmed','cancelled')`. Create
  inserts `status='pending'`; cancel is an **UPDATE** to
  `status='cancelled'` (not a DELETE). `confirmed` is not reachable from
  the client today — it is an operator/service-role transition.
- `src/lib/account/bookings.ts` (`supabaseBookingRepository.create` /
  `.cancel`) runs **client-side** with the user's JWT. `create` inserts
  and returns the row; `cancel` updates scoped to `user_id` + `id`.
- Copy lives in `src/content/strings.en.json` — a **flat, dot-keyed JSON
  object** — read via `t(key)` (`en[key]`) from
  `src/lib/content/strings.ts`. Edge Functions run in Deno and cannot
  import the Vite app's `@/`-aliased `t()`.
- Attraction display names live in `src/data/attractions.json`
  (`name` field), read through the attractions repository in the app.
- No `supabase/functions/` directory exists yet. Phase 9 reviews
  (`migrations/0001_reviews.sql`) and the Phase 11 `payments` table
  (defined in SPEC §6.6, not yet migrated) bound the schema neighbourhood.

Forces:

- Three-layer separation: no English string and no attraction fact may be
  hard-coded in the function. Copy must trace to the content layer.
- The provider key must never enter the browser bundle.
- A failed or duplicated send must never corrupt a booking or double-mail
  the user (idempotency + decoupling).
- The function must not be an open relay: an unauthenticated caller must
  not be able to make it send arbitrary mail.
- 80/20: function source, content keys, trigger config, migration, and
  tests are code-deliverable; provider account, DNS, the function secret,
  and deployment are human/live-infra.

## Decision

Implement a single Edge Function `booking-email` triggered by a **Supabase
Database Webhook** on `public.tour_bookings`, sending provider-agnostic
transactional mail whose copy is sourced from the content layer at bundle
time, with idempotency enforced by a new user-scoped `email_log` table.

### D1 — Trigger: Database Webhook on `tour_bookings`, not client invoke

A managed Supabase **Database Webhook** fires on `INSERT` and `UPDATE` of
`public.tour_bookings` and POSTs the row (with `record` and `old_record`)
to the `booking-email` function.

- On `INSERT` → send the **booking-created** email (row arrives
  `status='pending'`).
- On `UPDATE` where `old_record.status != 'cancelled'` and
  `record.status = 'cancelled'` → send the **booking-cancelled** email.
- On `UPDATE` to `status='confirmed'` → **out of scope for Phase 10**
  (confirmed is operator-driven and not client-reachable today; a
  `booking-confirmed` template is deferred). The function evaluates the
  transition explicitly and ignores all other UPDATEs (e.g. notes edits).

Rationale: the webhook fires from the committed DB state, so email is a
side effect of *persisted* truth, not of an optimistic client call. It
survives across clients (a future admin tool, the migrate script, or a
mobile app), keeps `bookings.ts` unchanged (no `functions.invoke`, no
extra client surface, no JWT-forwarding concern), and centralises the
status-transition logic in one server-side place.

Rejected alternatives: see Alternatives A and B.

### D2 — Email copy: bundled snapshot of the content layer (single source)

The function does not duplicate strings and does not hard-code English.
The `email.*` keys are authored **once** in `src/content/strings.en.json`
(the canonical content layer). A small build step
(`scripts/build-email-copy.ts`) extracts the `email.*` subset into
`supabase/functions/_shared/email-copy.json` at deploy time, and the Deno
function imports that JSON and resolves keys with a tiny local
`t(key)` shim (same `obj[key]` lookup as the app's `t`).

- Single authoring source: `strings.en.json`. The snapshot is generated,
  never hand-edited (header comment + `.gitignore`-or-checked-in decision
  is a sequencing detail; recommend **checked in** so CI can diff drift).
- A CI check asserts the snapshot is in sync with `strings.en.json`
  (regenerate-and-`git diff --exit-code`), so a string change that is not
  re-snapshotted fails the build rather than silently shipping stale copy.
- Templates compose from multiple keys (subject, greeting, body lines,
  signature) — strings never contain HTML, consistent with the content
  rule. Dynamic values (attraction name, tour date, party size) are
  interpolated by the function from the webhook `record`, not stored in
  copy.

This preserves the three-layer bridge: copy still lives in the content
layer; the function reads a generated projection of it, exactly as the app
reads it through `t()`.

### D3 — Recipient + PII minimisation

`tour_bookings` carries no email. The function resolves the recipient
inside Deno using the **service-role client** via
`auth.admin.getUserById(record.user_id)` and reads only `email` (and, if
present, a display name). The email address is fetched server-side, used
for the `to:` field, and never returned to any client.

PII carried in the message (§44 — no PII beyond what the message needs):

- Recipient email (in the envelope only).
- Attraction display name (resolved from `attraction_id`; a fact, not
  PII).
- Tour date, party size, booking status.
- **Not** included: `notes` (free-text, may contain PII the user did not
  intend to echo), `user_id`, internal ids beyond a short booking
  reference, or any other user's data.

### D4 — Provider behind a thin interface; Resend as the first impl

Define a minimal `EmailProvider` interface in
`supabase/functions/_shared/email.ts`:
`sendEmail({ to, subject, html, text, idempotencyKey })`. Provide a single
`resendProvider` implementation reading `EMAIL_PROVIDER_API_KEY`. The
interface keeps the provider swappable (SES, Postmark) without touching
trigger or copy logic. Sender domain and DNS (SPF/DKIM/DMARC) are
live-infra (see §Live-infra).

### D5 — Inbound auth: the function is not an open relay

The function rejects any request lacking a valid shared secret. Supabase
Database Webhooks send configured headers; the function requires a
`WEBHOOK_SECRET` (a second Edge Function secret) and compares it in
constant time before doing any work. The function additionally validates
the payload shape (table = `tour_bookings`, expected `type`, presence of
`record.user_id`) and fails fast on anything unexpected. It uses the
service-role key only after the inbound secret check passes. No part of
this path is reachable from the browser, and no secret is `VITE_`-exposed.

### D6 — Idempotency via a user-scoped `email_log` table (RLS in same migration)

A new migration `supabase/migrations/0003_email_log.sql` adds:

```
public.email_log (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null references public.tour_bookings(id) on delete cascade,
  event_type text not null check (event_type in ('created','cancelled')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  unique (booking_id, event_type)
)
```

The row is an idempotency *claim*: insert-before-send, a surviving row means
sent. There is no `status` column - on a send failure the function deletes its
row so a manual re-drive can retry; a successful send records
`provider_message_id`. `event_type` uses the short `created`/`cancelled` values
(already scoped to a booking by `booking_id`), matching `BookingEvent`.

- The `unique (booking_id, event_type)` constraint is the idempotency
  key: the function attempts an insert *before* sending; a duplicate
  webhook delivery hits the unique violation and the function returns
  early without a second send. This also seeds the provider
  `idempotencyKey` (`<booking_id>:<event_type>`).
- RLS is enabled **in the same migration**: users may `select` their own
  rows (`auth.uid() = user_id`); there is **no client insert/update/delete
  policy** — the service-role function bypasses RLS to write, mirroring the
  `payments`-table pattern (SPEC §6.6). This is a user-scoped table, so it
  must not ship without RLS (api-conventions).
- A delivery failure is logged (`status='failed'`) but the function
  returns 2xx so the webhook is not retried into a duplicate side effect;
  re-drive is operator-controlled. The booking itself is never mutated by
  the function, so a send failure cannot break create/cancel.

This is an **additive** migration. It does not alter §6.3 tables
(`profiles`, `saved_attractions`, `tour_bookings`) and does not touch the
`Attraction` type — no §6.1/§6.3 contract divergence.

## Consequences

Positive:

- Email is a side effect of committed DB state, decoupled from the client;
  `bookings.ts` and the repository contract are untouched.
- The provider key and recipient email never reach the browser; the
  inbound secret check prevents an open relay.
- Copy stays in the content layer with CI-enforced drift detection; no
  hard-coded English in the function.
- Idempotency is enforced at the database (unique constraint), not by
  best-effort client logic; failed sends never corrupt bookings.
- Provider is swappable behind `EmailProvider`.

Negative / costs:

- Adds a server tier (Deno Edge Functions) and three new function secrets
  to operate: `EMAIL_PROVIDER_API_KEY`, `WEBHOOK_SECRET`, and `EMAIL_FROM`
  (the verified sender address). All are Edge Function secrets, never `VITE_`.
- A new generated artefact (`email-copy.json`) and a CI sync check to
  maintain.
- The attraction display name is read from the `attractions` table (Phase
  2.5). If that table is absent/empty the function logs a warning and uses a
  generic content-layer label, so `attractions.sql` should be applied before
  deploy for friendly names. Remote Deno deps are pinned via
  `supabase/functions/deno.json` (no floating major over the service-role key).
- Database Webhooks are configured in the Supabase dashboard (live-infra),
  so the trigger is not fully expressed in version-controlled SQL; the
  webhook config must be documented in the runbook.

Follow-on work:

- `booking-confirmed` template + transition when an operator-confirm flow
  lands.
- Optional review-created email (SPEC §43 "optionally") — same pattern, a
  second webhook on `public.reviews`; deferred unless prioritised.
- Phase 11 (Stripe) will add its own Edge Functions; `_shared/` provider
  and secret-check helpers should be reused, not re-invented.
- i18n: when `strings.kri.json` lands, the snapshot step extracts per
  locale and the function selects by recipient locale.

## Alternatives considered

- **A. Client/repository invokes the function (`supabase.functions.invoke`)
  after create/cancel.** Rejected: couples email to an optimistic client
  call (mail can send for a write that later fails, or not send if the tab
  closes), forwards the user JWT into the mail path, expands the client
  surface, and makes idempotency a client concern. The webhook fires from
  committed state instead.
- **B. Postgres trigger + `pg_net`/`pgmq` → function.** Rejected for
  Phase 10 as heavier than needed: requires enabling and operating
  `pg_net`/queue extensions and hand-written PL/pgSQL HTTP calls. A managed
  Database Webhook gives the same "fire on row change" semantics with less
  bespoke surface. Revisit if delivery guarantees outgrow the webhook.
- **C. Hard-code email copy in the Deno function.** Rejected: violates the
  three-layer rule (hard-coded English outside the content layer) and
  forks copy from `strings.en.json`. The bundled-snapshot approach (D2)
  keeps one source.
- **D. Add an `email` column to `tour_bookings`.** Rejected: duplicates
  `auth.users.email`, risks staleness, and widens PII in a client-readable
  table. The function resolves the address server-side via
  `auth.admin.getUserById` (D3).
- **E. No idempotency table; rely on provider idempotency key only.**
  Rejected: a provider key guards the provider but not a duplicate webhook
  that resolves recipients and composes mail; the DB unique constraint is
  the durable guard and also gives users a visible send history.

## Stop-and-ask flags (human decision required before build)

1. **Provider choice** — Resend is the SPEC example, not a mandate.
   Confirm Resend vs SES/Postmark before the `EmailProvider` impl is
   written (affects DNS, SDK, secret format).
2. **Schema addition** — the `email_log` table (D6) is a new user-scoped
   table. Per api-conventions it needs explicit sign-off even though RLS
   ships in the same migration.
3. **Trigger mechanism** — Database Webhook (D1) vs pg_net trigger (Alt B)
   vs client invoke (Alt A). Confirm the managed-webhook choice; it
   implies dashboard configuration that is not in version control.
4. **Snapshot artefact policy** — checked-in `email-copy.json` with a CI
   drift gate (recommended) vs generated-and-ignored. Confirm.
