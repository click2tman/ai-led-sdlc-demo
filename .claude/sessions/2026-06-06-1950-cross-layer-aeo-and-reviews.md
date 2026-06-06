---
id: 2026-06-06-1950-cross-layer-aeo-and-reviews
layer: cross-layer
issue: #2
context_pack: none
started: 2026-06-06 19:50 EDT
ended: in-progress
author: Tamba S Lamin
actor: claude-autonomous
branch: issue-2-aeo
---

# Session: aeo-and-reviews

## Overview
Work issues #2 (Phase 3 AEO) and #3 (Phase 9 real-time reviews) together.
Audit found AEO (#2) is ~80% shipped in Phase 3: SpeakableSpecification
JSON-LD, data-speakable lead/facts, self-contained FAQPage, aggregateRating
in graph.ts. #2 remaining is a small polish: a concise, citable speakable
quick-facts block high on the detail page (SPEC §13.3), plus validation.
#3 (reviews) is the substantial build and per its issue + SPEC §6.6 needs an
architect ADR before building (new reviews table, RLS, Realtime, moderation,
and feeding aggregateRating/Review JSON-LD from published reviews - the
bridge back to #2). Architect ADR launched in background; build #3 after
human sign-off.

## Goals
- [ ] #2: speakable quick-facts block high on detail page (region/hours/rating)
- [ ] #2: verify Speakable JSON-LD validates; FAQ answers self-contained
- [ ] #2: gates green; PR to dev; close #2
- [ ] #3: architect ADR for reviews schema/RLS/SSG-vs-dynamic/JSON-LD
- [ ] #3: human sign-off on ADR, then build on issue-3-reviews branch

## Plan
Autonomous policy (auto-fix/commit/update; escalate on architectural
decision, security Medium+, schema/contract change, live-infra). #3 schema
is a new public contract + touches Supabase -> architect ADR + human
sign-off gate before any reviews code.

## Updates

- 2026-06-06 19:54 EDT - #2 AEO: extended SpeakableSpecification coverage to
  location + rating in the detail header (data-speakable="facts"), matching
  §13.3 "hours, location, rating" (previously only hours/HoursBlock was
  marked). Zero visual change. Verified prerendered detail carries the
  Speakable JSON-LD + 3 facts/1 lead marks; FAQ answers already self-
  contained. Added tests/lib/seo-graph.test.ts (speakable, aggregateRating,
  self-contained FAQ). 35 tests + a11y 5/5 green. Branch issue-2-aeo.
- 2026-06-06 19:53 EDT - #3 architect ADR delivered:
  docs/adr/0004-phase-9-reviews.md (Status: Proposed). Decides schema deltas,
  RLS (author-only; operator take-down), the SSG-vs-live crux (build-time
  snapshot JSON-LD + client Realtime list, graceful fallback to static
  rating), ReviewRepository shape, security, content/graph deltas, migration
  file. 4 stop-and-ask items flagged for human sign-off; load-bearing call is
  whether to do a build-time service-role read for JSON-LD. Awaiting sign-off
  before building #3.

## Findings

## Open questions

## Outcomes

## Next session
