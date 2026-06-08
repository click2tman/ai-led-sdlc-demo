/* 0005_review_flags.sql - Review flagging + moderator role (issue #50, ADR 0009).
   Adds end-user flagging (review_flags, RLS own-row only), a moderator role on
   profiles, and the moderator action mechanism: a second reviews UPDATE policy
   gated by is_moderator(), with a content-guard trigger so a moderator may
   change ONLY status, never body/rating. The existing profiles own-update
   policy is HARDENED to pin role (prevents self-escalation). All RLS is in this
   file. The §6.1 Attraction type and the reviews content columns are untouched. */

-- 1. review_flags: one flag per user per review; own-row RLS only so flag
--    counts and flagger identities never leak to other users.
create table public.review_flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'offensive', 'inaccurate', 'other')),
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);
create index on public.review_flags (review_id);
alter table public.review_flags enable row level security;

-- A user flags only as themselves and not their own review; own-row read/delete.
create policy "own flag insert" on public.review_flags
  for insert with check (
    auth.uid() = user_id
    and review_id not in (select id from public.reviews where user_id = auth.uid())
  );
create policy "own flag read" on public.review_flags
  for select using (auth.uid() = user_id);
create policy "own flag delete" on public.review_flags
  for delete using (auth.uid() = user_id);

-- 2. Moderator role on profiles + a helper used by the reviews policies.
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'moderator'));

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'moderator'
  );
$$;

-- Harden the own-update policy: a user may update their profile but NOT change
-- their own role (otherwise a direct PATCH self-grants moderator). §6.3 touch.
drop policy "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- 3. Moderator action on reviews: a second UPDATE policy (coexists with the
--    author policy; permissive policies OR) + a moderator read for triage.
create policy "moderator review status update" on public.reviews
  for update using (public.is_moderator()) with check (public.is_moderator());
create policy "moderator reviews read" on public.reviews
  for select using (public.is_moderator());

-- The load-bearing control (issue #50): a non-author (moderator or service
-- role) may change ONLY status; altering content/ownership raises.
create or replace function public.guard_review_content() returns trigger
language plpgsql as $$
begin
  if auth.uid() is distinct from old.user_id then
    if new.body is distinct from old.body
       or new.rating is distinct from old.rating
       or new.user_id is distinct from old.user_id
       or new.attraction_id is distinct from old.attraction_id then
      raise exception 'moderators may change only review status, not content';
    end if;
  end if;
  return new;
end; $$;

create trigger reviews_guard_content
  before update on public.reviews
  for each row execute function public.guard_review_content();

-- 4. Moderator read access: a view + a gated definer RPC. The raw review_flags
--    table stays own-row only (1); counts reach moderators only through here.
create or replace view public.moderation_queue as
  select r.id as review_id, r.attraction_id, r.status, r.created_at,
         count(f.id) as flag_count,
         array_agg(distinct f.reason) as reasons,
         max(f.created_at) as last_flagged_at
  from public.reviews r
  join public.review_flags f on f.review_id = r.id
  group by r.id, r.attraction_id, r.status, r.created_at;

create or replace function public.list_moderation_queue()
returns setof public.moderation_queue
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden';
  end if;
  return query select * from public.moderation_queue order by last_flagged_at desc;
end; $$;
