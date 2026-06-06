/* attractions.sql - Phase 2.5 (optional, SPEC §5.3). Adds a public-read
   attractions table so VITE_ATTRACTIONS_SOURCE=supabase serves the same data
   as the JSON file. Public read only: there is deliberately no write policy
   (editorial writes happen out of band / via the migration service role). */

create table public.attractions (
  id                text primary key,
  name              text not null,
  short_description text not null,
  long_description  text not null,
  region            text not null,
  latitude          numeric not null,
  longitude         numeric not null,
  hours_open        time,
  hours_close       time,
  hours_days        text,
  hours_notes       text,
  rating            numeric,
  review_count      int,
  images            text[],
  video_url         text,
  tags              text[],
  sources           text[],
  faqs              jsonb,
  updated_at        timestamptz not null default now()
);

alter table public.attractions enable row level security;

create policy "public read attractions"
  on public.attractions for select
  using (true);
