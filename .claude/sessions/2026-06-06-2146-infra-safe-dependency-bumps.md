---
id: 2026-06-06-2146-infra-safe-dependency-bumps
layer: infra
issue: #38
context_pack: none
started: 2026-06-06 21:46 EDT
ended: 2026-06-06 21:50 EDT
author: Tamba S Lamin
actor: claude-autonomous
branch: chore-dep-bumps-safe
---

# Session: safe-dependency-bumps

## Overview
Dependency triage (#38), Group B safe majors. Consolidate the CI-green app
dependency majors onto a dev branch and test against the full app (Phase 6 +
reviews + toast), rather than the blocked dependabot-to-main PRs.

## Goals
- [x] react-router-dom 6 -> 7.17.0 (fix SSR import; verify SSG + hydration)
- [x] lucide-react 0.469 -> 1.17.0; jsdom 25 -> 29.1.1
- [x] HOLD react-helmet-async 3.0.0 (supply-chain caution: 2.0.5 is the last
      legitimate release; 3.0.0 needs provenance verification) and @types/node
      25 (runtime is Node 20)
- [x] full gates + browser smoke; PR to dev

## Plan
Autonomous policy. RR7 is the risk (heavy router use in Phase 6 + SSG).

## Updates
- 2026-06-06 21:50 EDT - Bumped react-router-dom@7.17.0, lucide-react@1.17.0,
  jsdom@29.1.1. One code change: react-router-dom/server was removed in RR7,
  so entry-server.tsx imports createStaticHandler/createStaticRouter/
  StaticRouterProvider from 'react-router'. Gates green: typecheck, lint, 48
  tests, build:prerender, a11y 5/5. Browser smoke: client navigation works,
  detail + reviews render, no non-HMR console errors. Held helmet 3 (supply
  chain) + @types/node 25. Supersedes dependabot #29/#30/#31.

## Findings
- react-helmet-async 3.0.0: the package's last legitimate npm release is
  2.0.5; a 3.0.0 is unexpected and should be checked for provenance before
  merging (supply-chain caution). Held; dependabot #28 left open.

## Open questions

## Outcomes
react-router-dom 7 + lucide-react 1 + jsdom 29 upgraded and verified against
the full app; PR to dev. Held helmet 3 (#28, supply chain) and @types/node
(#24, Node 20). Group C (React 19 #23/#25, ESLint flat-config #26/#32, Vite 8
#27) remain coordinated-migration work; Group A CI-action bumps (#20-22) are
the user's quick merges.

## Next session
