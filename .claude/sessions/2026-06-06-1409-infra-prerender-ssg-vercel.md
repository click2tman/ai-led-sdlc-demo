---
id: 2026-06-06-1409-infra-prerender-ssg-vercel
layer: infra
issue: #9
context_pack: none
started: 2026-06-06 14:09 EDT
ended: 2026-06-06 14:35 EDT
author: Tamba S Lamin
actor: claude-autonomous
branch: chore-prerender-ssg-vercel
---

# Session: prerender-ssg-vercel

## Overview
Replace the Playwright-based prerender (ADR 0002) with a browser-free
build-time SSG using react-dom/server + React Router's static handler, so
pre-rendering runs on Vercel's build image (Chromium can't). Also align the
duplicated vercel.json configs. SPEC §13.1 (pre-render), §12 (deploy), ADR 0003.

## Goals
- [ ] Extract route config to src/routes.tsx (shared by client + SSG)
- [ ] src/entry-server.tsx render() via createStaticHandler + renderToString + Helmet
- [ ] Rewrite scripts/prerender.ts to use the Vite SSR bundle (no browser)
- [ ] Wire vite build --ssr into build:prerender; Vercel build command
- [ ] Align root and app-level vercel.json
- [ ] Verify static HTML carries content + JSON-LD; deploy preview check

## Plan
SSG pattern: vite build (client) -> vite build --ssr entry-server -> tsx
prerender reads dist/index.html template, renders each route to static HTML.

## Updates

- 2026-06-06 14:30 EDT - Implemented browser-free SSG (commit on
  chore-prerender-ssg-vercel, PR #34). routes.tsx (shared), entry-server.tsx
  (react-dom/server + static handler + helmet + loader data), prerender.ts
  rewritten to consume vite --ssr bundle, main.tsx seeds
  window.__staticRouterHydrationData into createBrowserRouter. vite.config
  ssr.noExternal react-helmet-async. Both vercel.json aligned on routes
  filesystem-handle; root build cmd build:prerender. ADRs 0002/0003 amended.

## Findings

- Caught a client crash: prerendered routes hit useLoaderData()===undefined.
  Fix = serialize loader data + seed createBrowserRouter (hydrationData).
- vite preview serves root index.html for nested routes (SPA fallback), so it
  mis-serves prerendered nested files locally. a11y CI uses plain `npm run
  build` (equivalent DOM). Vercel serves nested files via routes filesystem
  handle. Verified on PR #34 Vercel preview: detail/about render with static
  content, correct hydration, 0 console errors.

## Open questions

## Outcomes

Browser-free SSG prerender shipping on Vercel (PR #34 -> dev). All public
routes serve prerendered static HTML with content + JSON-LD + correct per-
route head; client hydration-seeded, no crash. Local gates green
(typecheck/lint/11 tests/build:prerender/plain-build a11y 0x5). vercel.json
configs aligned. Verified on live Vercel preview (0 console errors on deep
routes). Tradeoff: Vercel build uses npm run build:prerender (no Chromium);
a11y CI uses plain build due to vite preview SPA-fallback limitation.

## Next session

1. Merge PR #34 -> dev (CI gates unaffected; should be green).
2. Promote dev -> main (new promotion PR) so production serves prerendered SSG.
3. Optional: make a11y CI serve the prerendered build via a filesystem-first
   static server to test the exact shipped artifact (currently plain SPA build).
4. Phase 6 (auth) remains the next feature.
