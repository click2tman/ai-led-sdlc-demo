/* 0001_reviews.sql - Phase 9 reviews (SPEC §6.6, ADR 0004). A new, user-
   scoped reviews table with RLS in the same migration. The §6.3 schema.sql
   (profiles, saved_attractions, tour_bookings) is NOT touched. One published
   review per user per attraction; public reads published, authors manage
   their own. status is text+check (not an enum) so moderation states can
   grow cheaply (ADR D1.3). Cross-user moderation is operator/service-role via
   the dashboard - there is deliberately no client moderator policy (ADR D2). */

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attraction_id text not null,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'published'
    check (status in ('published', 'flagged', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, attraction_id)
);

-- Public list query filters (attraction_id, status); user_id serves
-- "my review" lookups and the defense-in-depth write filter.
create index on public.reviews (attraction_id, status);
create index on public.reviews (user_id);

alter table public.reviews enable row level security;

-- Public reads published reviews; authors also read their own non-published.
create policy "published reviews read" on public.reviews
  for select using (status = 'published' or auth.uid() = user_id);
create policy "own review insert" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "own review update" on public.reviews
  for update using (auth.uid() = user_id);
create policy "own review delete" on public.reviews
  for delete using (auth.uid() = user_id);

-- Maintain updated_at on edit (§9.3 allows editing one's own review; feeds
-- the JSON-LD Review dateModified).
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
