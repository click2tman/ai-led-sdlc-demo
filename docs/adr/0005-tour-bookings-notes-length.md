<!-- 0005-tour-bookings-notes-length.md - ADR: bound tour_bookings.notes at the database with a check constraint (defense in depth behind the client cap). -->

# ADR 0005: Bound `tour_bookings.notes` length at the database

- Status: Accepted (2026-06-06)
- Date: 2026-06-06
- Deciders: Tamba S Lamin
- Traces to: SPEC §6.3 (tour_bookings schema), §9.4 (Schedule a Tour),
  security review of PR #37 (issue #42)
- Relates to: ADR 0004 (reviews body is already DB-bounded, the precedent)

## Context

`ScheduleTourModal` caps the booking `notes` field at 500 characters
(textarea `maxLength` + an explicit `validate()` guard). The database
column is `notes text` with no ceiling, so a client that bypasses the UI
(a direct PostgREST insert) could store an arbitrarily large note, which
is then read back in `tourBookings.list()` and rendered on `/account`.
The reviews table already bounds its body at the DB layer
(`check (char_length(body) between 1 and 2000)`); bookings should match
that defense-in-depth posture. The security review of PR #37 flagged the
gap as Low and asked for an ADR before changing the §6.3 schema.

## Decision

Add a `check` constraint bounding `notes` to 500 characters (matching the
client cap) at the database, delivered as a **migration**
(`supabase/migrations/0002_notes_constraint.sql`), with `supabase/schema.sql`
(the canonical §6.3 schema) updated to match so a fresh apply and an
incremental migration converge.

```sql
alter table public.tour_bookings
  add constraint tour_bookings_notes_length
  check (notes is null or char_length(notes) <= 500);
```

- `notes is null or ...` keeps the column nullable (notes are optional,
  §9.4); only a present value is bounded.
- 500 matches `MAX_NOTES` in `ScheduleTourModal`; the two are kept in
  step (the client gives a friendly message, the DB is the hard floor).
- This is an **additive** constraint on a Phase 2 table. RLS is
  unchanged. No data migration (existing rows are within the bound; if
  any exceeded it the `add constraint` would fail loudly, which is the
  correct signal).

## Consequences

- A bypassed insert with an over-long note now fails at the DB with a
  constraint violation instead of being silently stored.
- The §6.3 schema diverges from the SPEC text by one additive check; the
  SPEC's `notes text` is a floor, not a ceiling, so this is a
  hardening refinement, recorded here for traceability.
- Future tables with free-text user input should bound length at the DB
  by default (reviews, this; the pattern is now consistent).

## Alternatives considered

- **Client-only cap (status quo).** Rejected: a direct API insert
  bypasses it; the security review asked for the DB guard.
- **A trigger that truncates.** Rejected: silently mutating user input
  masks the problem; failing fast on the constraint is clearer.
