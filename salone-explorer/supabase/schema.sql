/* schema.sql - Salone Explorer Supabase schema (SPEC §6.3): user-scoped
   profiles, saved_attractions, and tour_bookings with RLS and a new-user
   trigger. Apply in the Supabase SQL editor (Phase 5). Never disable RLS. */

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create type saved_kind as enum ('bookmark', 'favorite');

create table public.saved_attractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attraction_id text not null,
  kind saved_kind not null,
  created_at timestamptz not null default now(),
  unique (user_id, attraction_id, kind)
);
create index on public.saved_attractions (user_id, kind);

create type booking_status as enum ('pending', 'confirmed', 'cancelled');

create table public.tour_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attraction_id text not null,
  tour_date date not null,
  party_size int not null check (party_size between 1 and 20),
  -- Bounded to 500 chars (ADR 0005); matches the client cap in
  -- ScheduleTourModal. Named to match migrations/0002 so a fresh apply and
  -- an incremental migrate converge on the same constraint.
  notes text constraint tour_bookings_notes_length
    check (notes is null or char_length(notes) <= 500),
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index on public.tour_bookings (user_id, tour_date);

alter table public.profiles            enable row level security;
alter table public.saved_attractions   enable row level security;
alter table public.tour_bookings       enable row level security;

create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own saved read"     on public.saved_attractions for select using (auth.uid() = user_id);
create policy "own saved insert"   on public.saved_attractions for insert with check (auth.uid() = user_id);
create policy "own saved delete"   on public.saved_attractions for delete using (auth.uid() = user_id);

create policy "own bookings read"  on public.tour_bookings for select using (auth.uid() = user_id);
create policy "own bookings ins"   on public.tour_bookings for insert with check (auth.uid() = user_id);
create policy "own bookings upd"   on public.tour_bookings for update using (auth.uid() = user_id);
create policy "own bookings del"   on public.tour_bookings for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
