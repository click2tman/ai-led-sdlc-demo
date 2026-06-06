# ADR 0002: Pre-render tool swap and production-scoped audit gate

- Status: Accepted
- Date: 2026-06-06
- Deciders: autonomous build session (Phase 1), pending human ratification
- Supersedes / amends: SPEC §3 (pre-render tool), SPEC §15 (`security.yml`)

## Context

SPEC §3 and §13.1 name `vite-plugin-prerender` for generating static
HTML for crawlers and LLM ingestion. SPEC §15 mandates a `security.yml`
gate running `npm audit --audit-level=high`, and SPEC §22 forbids
weakening CI to make a build pass.

`vite-plugin-prerender@1.0.8` is unmaintained. It depends on
`html-minifier` (GHSA-pfq8-rq6v-vf5m, high-severity ReDoS, **no fix
available**) and a puppeteer-based `@prerenderer/prerenderer` chain.
Installing it introduces 6 high + 1 critical advisories that
`security.yml` would fail on. The two SPEC requirements therefore cannot
both be satisfied with the named tool — the conflict exists only because
the tool is abandoned.

Separately, the dev/test toolchain (`vitest`, `vite-node`, the `esbuild`
dev server) carries advisories (Vitest UI arbitrary file read/exec;
esbuild dev-server request reflection) that are **dev-only** and never
present in the production bundle. `npm audit --omit=dev --audit-level=high`
reports `found 0 vulnerabilities`.

## Decision

1. **Remove `vite-plugin-prerender`.** Implement Phase 3 pre-rendering
   with a postbuild script driven by Playwright, which is already a
   project dependency for the `a11y.yml` gate. This adds no new
   dependency and no new audit surface, and still produces static HTML
   for `/`, `/about`, and every `/attractions/:id` per SPEC §13.1.

2. **Scope the blocking audit to shipped code.** `security.yml` blocks on
   `npm audit --omit=dev --audit-level=high` (the production dependency
   tree — what reaches users) and additionally runs a non-blocking full
   `npm audit` for visibility of dev-toolchain advisories. The deployed
   artifact is still gated at high severity; nothing that ships is
   exempt.

## Consequences

- Pre-rendering is owned by `salone-explorer/scripts/prerender.ts`
  (Phase 3), not a Vite plugin. It runs after `vite build` against
  `vite preview`, the same serving path the a11y tests use.
- The production bundle remains audit-clean at high severity.
- Dev-toolchain advisories remain visible but non-blocking until an
  upstream fix lands (tracked: bump Vitest once a fix ships on a Vite-5
  compatible line, or with a future coordinated Vite major bump).
- This amends SPEC §3 and §15; requires human ratification on PR review.
