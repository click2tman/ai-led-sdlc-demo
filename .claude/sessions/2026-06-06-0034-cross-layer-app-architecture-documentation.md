---
id: 2026-06-06-0034-cross-layer-app-architecture-documentation
layer: cross-layer
issue: none
context_pack: none
started: 2026-06-06 00:34 EDT
ended: 2026-06-06 01:45 EDT
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

### Update - 2026-06-06 01:35 EDT

Summary: Established the app-vs-harness separation - app scaffolds into a
salone-explorer/ subdirectory; Vercel Root Directory = salone-explorer so
the deployed artifact never contains .claude/ or docs/. Updated SPEC,
CLAUDE.md, the keystone rule, the executed harness checks, README,
architecture.html, STUDENT_GUIDE, and wrote ADR 0001.

Git:
  branch: dev
  last-commit: 00f8e0f docs: record production deployment targets in SPEC and README
  files-touched-since-last-update:
    - CLAUDE.md (new "Repository layout: app vs harness" section + commands cd note)
    - SPEC.md (§12 re-rooted tree w/ repo-root wrapper + .github at root; §18 cd; §19 P1/P4 working-directory + Vercel Root Directory)
    - .claude/rules/three-layer-separation.md (app-dir convention in Verification)
    - .claude/skills/verification-loop/SKILL.md (cd salone-explorer preamble; grep path note)
    - .claude/agents/code-reviewer.md (git diff pathspec -> salone-explorer/src)
    - README.md (Project Structure re-rooted; Vercel Root Directory)
    - docs/architecture.html (structure block, deploy-boundary callout, ADR-09, infra node label)
    - docs/adr/0001-app-subdirectory-separation.md (NEW)
    - STUDENT_GUIDE.md (two grep examples + Vercel Root Directory)

Tasks (TaskList):
  just-completed:
    - Decide + document app subfolder (salone-explorer/) and Vercel Root Directory
    - Re-point all repo-root-executed harness checks to the app dir
    - Write ADR 0001; add ADR-09 card; re-verify architecture.html (9/9 SVG)

Verification:
  last-run: 2026-06-06 01:33 EDT (architecture.html browser render)
  status: pass (9/9 Mermaid diagrams render; ADR-09 present; no errors).
    npm verification-loop N/A pre-scaffold.

Notes:
  - Key correctness fix: harness checks (verification-loop grep,
    code-reviewer git diff) that run from the repo root were re-pointed to
    salone-explorer/ - else a root-level src/ grep would find nothing and
    silently pass, masking three-layer violations.
  - .github/ MUST stay at repo root (GitHub Actions requirement); CI jobs
    use working-directory: salone-explorer. Documented in SPEC §19 step 18.
  - Folder name salone-explorer chosen to match the existing SPEC scaffold
    command (npm create vite@latest salone-explorer) - clarifies, not changes.
  - Decisions captured via AskUserQuestion (folder name; scope = SPEC +
    ADR + re-point wiring).

### Update - 2026-06-06 01:40 EDT

Summary: App/harness separation change set complete and verified;
awaiting owner approval to commit.

Git:
  branch: dev
  last-commit: 00f8e0f docs: record production deployment targets in SPEC and README
  staged: 0   modified: 39   untracked: 28
  (NOTE: counts inflated by the unrelated AI-SDLC-Training-Flyer/ ->
   docs/ move, which is NOT part of this change and stays excluded.)
  intended change set (9 modified + 1 new dir):
    - CLAUDE.md, SPEC.md, README.md, STUDENT_GUIDE.md
    - docs/architecture.html, docs/adr/ (new: 0001-app-subdirectory-separation.md)
    - .claude/rules/three-layer-separation.md
    - .claude/skills/verification-loop/SKILL.md
    - .claude/agents/code-reviewer.md

Tasks (TaskList):
  completed: 0   in-progress: 0   pending: 0
  just-completed:
    - App-vs-harness separation: salone-explorer/ subdir + Vercel Root Directory
    - Re-point repo-root-executed harness checks to the app dir
    - ADR 0001 + ADR-09 card; architecture.html re-verified (9/9 SVG)

Verification:
  last-run: 2026-06-06 01:33 EDT (architecture.html render) + secret scan 01:38
  status: pass (9/9 Mermaid; ADR-09 present; secret scan clean).
    npm verification-loop N/A pre-scaffold.

Notes:
  - Proposed commit: "docs: separate shippable app into salone-explorer
    subdirectory" with trailer "Requirement: SPEC §12 - app/harness separation".
  - Two human-only follow-ups: set Vercel Root Directory = salone-explorer
    in the dashboard; CI workflows (Phase 4) need working-directory: salone-explorer.

## Findings

## Open questions
- [2026-06-06] AI-SDLC-Training-Flyer/ was moved to docs/ outside this
  session (git shows deletes + untracked docs/AI-SDLC-Training-Flyer/).
  Not committed here. Owner to confirm intent and stage separately.
- [RESOLVED 2026-06-06] Format: single self-contained HTML file (owner
  decision), not Markdown. Mermaid via CDN for flows; other diagram
  forms (tables, C4-style, layered block diagrams) where appropriate.

## Outcomes

Duration: ~1:11 (00:34 -> 01:45 EDT)
Commits: 2   PRs opened: 0   Files changed: 12 (3 committed; 9 + new docs/adr/ uncommitted)
Token usage (this session, approx; filtered by date 2026-06-06, spans the
earlier SPEC-expansion session too): total 42,719,503 (in:48,938
out:374,994 cacheW:745,025 cacheR:41,550,546) cost:n/a

Goals reached (all 10 original architecture-doc goals): all [x] (01:00).
Plus two follow-on deliverables the owner added mid-session:
  - [x] Record production deployment targets (prod domain, Vercel project,
    Supabase project) in SPEC + README (commit 00f8e0f).
  - [x] Separate the shippable app from the AI harness into a
    salone-explorer/ subdirectory; Vercel Root Directory excludes the
    tooling (01:40; UNCOMMITTED - see Next session).

Key accomplishments:
  - docs/architecture.html: 12-section architecture reference, 9 Mermaid
    diagrams, render-verified. Committed 79c8ee5.
  - Deployment targets recorded; VITE_SITE_URL set to the prod domain.
    Committed 00f8e0f.
  - App/harness separation fully specified and wired (SPEC §12/§18/§19,
    CLAUDE.md, keystone rule, verification-loop, code-reviewer, README,
    STUDENT_GUIDE, architecture.html) + ADR 0001. NOT yet committed.

Code changes:
  - docs/architecture.html (new, committed), docs/adr/0001-... (new, uncommitted)
  - SPEC.md, README.md, CLAUDE.md, STUDENT_GUIDE.md (separation + deploy targets)
  - .claude/rules/three-layer-separation.md, skills/verification-loop,
    agents/code-reviewer (re-pointed to salone-explorer/)

Decisions made:
  - App lives in salone-explorer/ subdir; Vercel Root Directory = that
    folder so the deploy never contains .claude/ or docs/. See
    docs/adr/0001-app-subdirectory-separation.md (ADR 0001 / ADR-09 card).
  - .github/ stays at repo root (Actions requirement); CI uses
    working-directory: salone-explorer.
  - VITE_SITE_URL = https://slint-ai-led-sdlc.tpgroupsl.com (prod domain).

Findings worth carrying:
  - Harness checks executed from the repo root (verification-loop grep,
    code-reviewer git diff) MUST target salone-explorer/ - a root-level
    src/ grep finds nothing and silently passes, masking three-layer
    violations. Re-pointed and warned against in the rule + skill.
  - AI-SDLC-Training-Flyer/ was moved to docs/ outside this session;
    excluded from all commits here. Owner to confirm + stage separately.

Verification status (final):
  - Secret scan: clean (01:38) over all changed files.
  - architecture.html: 9/9 Mermaid diagrams render to SVG, ADR-09 present,
    no syntax errors (browser-verified 01:33).
  - npm verification-loop (lint/typecheck/build): N/A pre-scaffold (no
    package.json yet).

## Next session

Pick up by reading:
  - This session file (Outcomes + the 01:35/01:40 updates)
  - docs/adr/0001-app-subdirectory-separation.md
  - Open questions below

Concrete next steps:
  1. COMMIT THE SEPARATION CHANGE SET (still uncommitted). Stage the 9
     intended files + docs/adr/ ONLY (exclude the flyer move + .DS_Store):
     git add CLAUDE.md SPEC.md README.md STUDENT_GUIDE.md \
       docs/architecture.html docs/adr \
       .claude/rules/three-layer-separation.md \
       .claude/skills/verification-loop/SKILL.md \
       .claude/agents/code-reviewer.md
     Commit: "docs: separate shippable app into salone-explorer subdirectory"
     Trailer: "Requirement: SPEC §12 - app/harness separation". Push dev.
  2. Resolve the AI-SDLC-Training-Flyer/ -> docs/ move (confirm intent;
     stage as its own commit, or revert).
  3. Gitignore + untrack .DS_Store (repo hygiene).
  4. When ready to build: /orchestrate the Phase 1 scaffold issue (#6).
     Scaffold into salone-explorer/; set Vercel Root Directory in the
     dashboard; CI workflows use working-directory: salone-explorer.

Unresolved blockers:
  - None blocking. Pending human actions (cannot be done by Claude): set
    Vercel Root Directory = salone-explorer in the dashboard; the flyer
    move needs an owner decision.

Recommended starting command:
  /session-resume 2026-06-06-0034-cross-layer-app-architecture-documentation
  (then commit the separation change set as step 1)
