/* 0003_email_log.sql - Phase 10 (issue #4, ADR 0007). Idempotency claim +
   audit for transactional booking emails. unique(booking_id, event_type) makes
   the booking-email Edge Function's insert-before-send the duplicate-delivery
   guard (Database Webhooks can deliver more than once). A surviving row means
   the email was sent; on a send failure the function DELETES its row so a
   manual re-drive can retry. The table is written ONLY by the function (the
   service role bypasses RLS); there is deliberately no client insert/update/
   delete policy. The §6.3 tables are untouched. event_type uses the short
   'created'/'cancelled' values (already scoped to a booking by booking_id),
   matching BookingEvent in _shared/types.ts. */

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null references public.tour_bookings(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'cancelled')),
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
