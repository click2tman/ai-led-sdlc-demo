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

### 2026-06-06 01:00 EDT - code-push
- Committed 79c8ee5 "docs: add architecture reference page across six
  views" (docs/architecture.html + this session file + the finalised
  SPEC-expansion session). Pushed dev -> origin/dev (351a389..79c8ee5).
- .DS_Store left unstaged (macOS artifact; should be gitignored).
- Committed directly on dev per pre-scaffold precedent (no CI gate yet).

### Update - 2026-06-06 01:05 EDT

Summary: Architecture reference page delivered, render-verified, and
pushed to origin/dev (79c8ee5). Session goals all met.

Git:
  branch: dev
  last-commit: 79c8ee5 docs: add architecture reference page across six views
  staged: 0   modified: 2   untracked: 0
  files-touched-since-last-update:
    - docs/architecture.html (committed)
    - .claude/sessions/2026-06-06-0034-cross-layer-app-architecture-documentation.md
    - .DS_Store (uncommitted macOS artifact)

Tasks (TaskList):
  completed: 0   in-progress: 0   pending: 0
  just-completed:
    - Write docs/architecture.html (six views + harness + testing + security + ADRs)
    - Render-verify all 9 Mermaid diagrams in a browser
    - Commit and push to origin/dev

Verification:
  last-run: 2026-06-06 00:55 EDT (browser render check via agent-browser)
  status: pass (9/9 Mermaid diagrams -> SVG, no syntax errors; harness
    counts match filesystem: 9 agents / 16 commands / 14 skills / 6 hooks
    / 8 rules). Note: npm verification-loop N/A pre-scaffold (no package.json).

Notes:
  - Two open follow-ups (not blockers): .DS_Store should be gitignored
    and untracked; docs/adr/ referenced by the page but does not yet
    exist (promote standing decisions to individual ADR files).
  - Committed directly on dev per pre-scaffold precedent; once scaffolded,
    route docs/feature changes through a branch + PR.

### Update - 2026-06-06 01:12 EDT

Summary: Recorded production deployment targets in SPEC.md and synced
README.md to match.

Git:
  branch: dev
  last-commit: 79c8ee5 docs: add architecture reference page across six views
  files-touched-since-last-update:
    - SPEC.md (masthead + §16 env vars + §19 Phase 4 step 21)
    - README.md (live-demo line, .env.example, Deployment > Vercel)

Tasks (TaskList):
  just-completed:
    - Add prod domain, Vercel project, Supabase project to SPEC + README

Verification:
  last-run: not run since last commit
  status: skipped (docs-only; verification-loop N/A pre-scaffold)

Notes:
  - Owner-provided facts: prod domain slint-ai-led-sdlc.tpgroupsl.com;
    Vercel project tp-isent/ai-led-sdlc-demo (existing - reuse, do not
    create new); Supabase project slint-ai-led-sdlc-demo.
  - Set VITE_SITE_URL to the prod domain in both SPEC §16 and README
    .env.example (it drives canonicals/sitemap/OG/llms.txt per §13.1);
    noted Vercel previews use their *.vercel.app URL.
  - SURPRISE (not mine): AI-SDLC-Training-Flyer/ shows as deleted and
    reappears untracked under docs/AI-SDLC-Training-Flyer/ - a directory
    move made outside this session. Left untouched; flagged to owner.

## Findings

## Open questions
- [2026-06-06] AI-SDLC-Training-Flyer/ was moved to docs/ outside this
  session (git shows deletes + untracked docs/AI-SDLC-Training-Flyer/).
  Not committed here. Owner to confirm intent and stage separately.
- [RESOLVED 2026-06-06] Format: single self-contained HTML file (owner
  decision), not Markdown. Mermaid via CDN for flows; other diagram
  forms (tables, C4-style, layered block diagrams) where appropriate.

## Outcomes

## Next session
