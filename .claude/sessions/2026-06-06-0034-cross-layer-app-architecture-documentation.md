---
id: 2026-06-06-0034-cross-layer-app-architecture-documentation
layer: cross-layer
issue: none
context_pack: none
started: 2026-06-06 00:34 EDT
ended: in-progress
author: Tamba S Lamin
actor: claude
branch: dev
---

# Session: app-architecture-documentation

## Overview
Produce a comprehensive architecture document for Salone Explorer, derived
entirely from SPEC.md (the single source of truth per spec-first). The
document covers six architecture views - business, development,
infrastructure, platform, application, runtime - plus the AI-led SDLC
tooling (the `.claude/` harness: rules, agents, skills, hooks, slash
commands) and how it drives development and deployment. It also documents
the testing approach (Vitest unit, Playwright + axe a11y, CI gates), the
security posture (RLS, secrets, OAuth, Stripe webhooks, OWASP framing),
the architecture decisions, and the binding engineering principles. Every
claim traces back to a SPEC.md section or a `.claude/rules/` rule. This is
a docs deliverable; the repo is still pre-scaffold (no application source),
so the artefact is a Markdown document under `docs/`.

## Goals
- [x] Business architecture (brand, publisher, value, stakeholders, scope, phases) - cite SPEC 1, 2, 17
- [x] Development architecture (three-layer separation, repository pattern, project structure, branching, CI) - cite SPEC 5, 6, 12, 19
- [x] Infrastructure architecture (Vercel deploy, Supabase, Edge Functions, CI workflows) - cite SPEC 3, 6.3, 19
- [x] Platform architecture (Vite + React + TS stack, Tailwind/tokens, Supabase platform, providers) - cite SPEC 3, 8
- [x] Application architecture (components/pages/lib, Attraction type, content/data layers, SEO/AEO/GEO) - cite SPEC 5, 6.1, 13, 14
- [x] Runtime architecture (request/render flow, prerender, repository selection, auth/session, realtime) - cite SPEC 5, 6, 9
- [x] AI-led SDLC tooling section (rules, agents, skills, hooks, slash commands; 80/20 split; orchestrate->handoff) - cite CLAUDE.md, .claude/rules/, docs/dev-guide/claude-harness.md
- [x] Testing approach (Vitest, Playwright + axe, a11y gate, verification-loop, TDD) - cite SPEC 18, 20, test-conventions
- [x] Security architecture (RLS, secrets, OAuth redirect, Stripe webhook, PCI posture, OWASP) - cite SPEC 6.3, 15, 16, 22
- [x] Architecture Decision Records and principles, each linked back to the SPEC section it derives from

## Plan
<To be filled by plan-then-code. Read SPEC.md fully first, inventory the
.claude/ harness, then draft docs/architecture.md (or a docs/architecture/
set if it grows past one file). Additive only; no application code.>

## Updates

### 2026-06-06 00:55 EDT - architecture.html drafted and render-verified
- Wrote docs/architecture.html (single self-contained file, sibling to
  docs/onboarding.html; reuses its dark-theme CSS design language).
- Twelve sections: overview + six architecture views (business,
  development, platform, application, infrastructure, runtime) + AI-led
  SDLC tooling + testing + security + 8 ADRs + principles. Each section
  carries a ".src" line citing the SPEC section(s) it derives from.
- 9 Mermaid diagrams (CDN, jsDelivr, dark theme): stakeholder map,
  repository-swap, application module graph, JSON-LD entity graph,
  CI/CD pipeline, 3 runtime sequence diagrams (render, OAuth, Stripe
  webhook), security trust-boundary. CSS block diagrams for the
  three-layer and platform-stack views; .pipe for the dev pipeline.
- Harness counts verified against the filesystem and match what the
  doc states: 9 agents, 16 commands, 14 skills, 6 hooks, 8 rules.
- Render-verified in a real browser (agent-browser): all 9 .mermaid
  blocks produced <svg>, zero syntax errors; scroll-spy active-section
  highlighting works; screenshots of overview + runtime sequence
  diagram confirm on-brand dark rendering.
- Mermaid CDN dependency decided by owner (AskUserQuestion).

## Findings

## Open questions
- [RESOLVED 2026-06-06] Format: single self-contained HTML file (owner
  decision), not Markdown. Mermaid via CDN for flows; other diagram
  forms (tables, C4-style, layered block diagrams) where appropriate.

## Outcomes

## Next session
