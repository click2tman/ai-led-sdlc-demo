/* 0002_notes_constraint.sql - Phase 6 follow-up (issue #42, ADR 0005). Bound
   tour_bookings.notes at the database (defense in depth behind the client's
   500-char cap in ScheduleTourModal). Additive; RLS unchanged. Existing rows
   are within the bound; if any exceeded it the add-constraint fails loudly,
   which is the correct signal. The §6.3 schema.sql is updated to match so a
   fresh apply and this migration converge. */

alter table public.tour_bookings
  add constraint tour_bookings_notes_length
  check (notes is null or char_length(notes) <= 500);
