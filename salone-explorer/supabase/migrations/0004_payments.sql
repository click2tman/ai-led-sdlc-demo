/* 0004_payments.sql - Phase 11 (issue #5, ADR 0008). A deposit against a tour
   booking, applied verbatim from SPEC §6.3. Status is written ONLY by the
   stripe-webhook Edge Function (service role) after Stripe-signature
   verification; there is deliberately no client insert/update/delete policy.
   Idempotency keys on stripe_payment_intent_id (unique) + a status guard in the
   webhook. Additive: the §6.3 tables and the §6.1 Attraction type are
   untouched; on a paid event the webhook transitions tour_bookings using the
   existing booking_status enum (pending -> confirmed), no DDL change. */

create type payment_status as enum
  ('requires_payment', 'paid', 'refunded', 'failed');
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null references public.tour_bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status payment_status not null default 'requires_payment',
  created_at timestamptz not null default now()
);
create index on public.payments (user_id);
alter table public.payments enable row level security;
-- Users read their own payments. Status is written ONLY by the Edge Function
-- (service role bypasses RLS) from a verified Stripe webhook; there is
-- deliberately no client insert/update policy.
create policy "own payments read" on public.payments
  for select using (auth.uid() = user_id);
