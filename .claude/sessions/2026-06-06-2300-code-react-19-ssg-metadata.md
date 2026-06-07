---
id: 2026-06-06-2300-code-react-19-ssg-metadata
layer: code
issue: #25
context_pack: none
started: 2026-06-06 23:00 EDT
ended: in-progress
author: Tamba S Lamin
actor: claude-autonomous
branch: issue-25-react-19
---

# Session: react-19-ssg-metadata

## Overview
Migrate to React 19 per ratified ADR 0006. Drop react-helmet-async; render
a full <html> document at prerender; native React 19 metadata for
title/meta/link (hoisted to <head>); JSON-LD <script> placed in <head> via
route `handle` (avoids logic duplication), serialized with the existing
serializeJsonLd <-escape (untouched). Code-layer only; no contract/schema
change. Branched off chore-vite-8 (RR7 + eslint flat + vite 8 stack).

## Goals
- [ ] deps react/react-dom/types ^19; remove react-helmet-async; align testing-library
- [ ] SeoHead native tags (no Helmet); drop jsonLd prop
- [ ] routes.tsx handle.jsonLd per route; pages drop jsonLd
- [ ] Document root + entry-server full-document render (react-dom/static)
- [ ] prerender: extract Vite assets, write full doc, JSON-LD-in-head assertion
- [ ] main.tsx/index.html/vite.config cleanup
- [ ] gates + head byte-diff vs React-18 baseline + a11y + JSON-LD validate

## Plan
ADR 0006 sequencing. Verify build:prerender after each major step; the
prerendered <head> must reach parity with the captured React-18 baseline
(/tmp/head-base-*.txt), modulo asset hashes.

## Updates
- 2026-06-07 00:18 EDT - React 19 migration complete per ADR 0006. Deps:
  react/react-dom/types ^19, react-helmet-async removed, testing-library
  16.3.2. SeoHead -> native React 19 metadata (hoisted). JsonLd -> native
  escaped <script> (dangerouslySetInnerHTML + serializeJsonLd untouched).
  routes.tsx handle.jsonLd per route; pages drop jsonLd. New Document root +
  entry-server full-document render via react-dom/server renderToString (the
  client uses createRoot not hydrateRoot, so markers are harmless; switched
  from prerenderToNodeStream to avoid a stream-type mismatch). prerender.ts
  reads dist/.vite/manifest.json for hashed assets, writes the full document,
  asserts JSON-LD in <head>. vite.config: build.manifest:true, dropped helmet
  ssr.noExternal. main.tsx: HelmetProvider removed.
  Verified: typecheck, lint, 48 tests, build:prerender (all routes; JSON-LD
  assertion passes), a11y 5/5, dev smoke (title updates on client nav via
  React 19 native metadata, no console errors). Prerendered <head> parity
  with the React-18 baseline: title/desc/canonical/OG/Twitter all hoisted +
  JSON-LD @graph in <head> incl. SpeakableSpecification + AggregateRating on
  the detail page. 0 vulnerabilities.

## Findings
- React 19 renderToString DOES hoist native <title>/<meta>/<link> into the
  document <head> when rendering a full <html> tree - no head library needed.
- React 19 also auto-emitted <link rel=preload as=image> for the hero logo (a
  bonus from native asset handling).
- JSON-LD is prerender-only (in the static <head> via the route handle); not
  re-rendered on client SPA navigation - correct for crawlers, which read the
  static HTML and do not SPA-navigate.

## Open questions

## Outcomes

## Next session
