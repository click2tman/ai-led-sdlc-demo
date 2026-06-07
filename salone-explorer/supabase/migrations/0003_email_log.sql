/* 0003_email_log.sql - Phase 10 (issue #4, ADR 0007). Idempotency + audit for
   transactional booking emails. unique(booking_id, event_type) makes the
   booking-email Edge Function's insert-before-send the duplicate-delivery
   guard (Database Webhooks can deliver more than once). The table is written
   ONLY by the function (the service role bypasses RLS); there is deliberately
   no client insert/update/delete policy. The §6.3 tables are untouched. */

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null references public.tour_bookings(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'cancelled')),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  unique (booking_id, event_type)
);
create index on public.email_log (user_id);

alter table public.email_log enable row level security;

-- Users may read their own email log (transparency). No client write policy:
-- only the booking-email Edge Function (service role) inserts here.
create policy "own email_log read" on public.email_log
  for select using (auth.uid() = user_id);
