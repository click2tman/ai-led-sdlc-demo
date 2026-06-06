# Salone Explorer (app)

The shippable Salone Explorer SPA - a Sierra Leone tour guide published by
TpGroup (SL) Limited under the FambulTik brand. This is the application tree;
the AI-led SDLC harness, docs, and spec live one level up at the repository
root. `SPEC.md` (repo root) is the single source of truth.

Vercel builds **only this directory** (Root Directory = `salone-explorer`),
so the harness and docs never reach the deployment.

## Stack

Vite 5 + React 18 + TypeScript (strict), react-router-dom v6 (data router),
Tailwind 3 over FambulTik/TpGroup design tokens, Radix UI primitives, Supabase
(Phase 5+). See `SPEC.md` §3.

## Architecture: three layers

Code never holds strings or facts (SPEC §5).

- **Code** - `src/components`, `src/pages`, `src/lib`, `src/seo`.
- **Data** - `src/data/*.json` (attractions, regions), read through the
  `attractions` repository in `src/lib/content`.
- **Content** - `src/content/strings.en.json`, read via `t("namespace.key")`.

The repository is selected by `VITE_ATTRACTIONS_SOURCE` (`file` default;
`supabase` after the Phase 2.5 migration).

## Commands

```bash
npm install
npm run dev            # Vite dev server (http://localhost:5173)
npm run build          # tsc --noEmit + bundle + sitemap.xml/llms.txt
npm run build:prerender # build + static pre-render of public routes
npm run preview        # serve dist/
npm run lint           # ESLint incl. jsx-a11y (errors fail the build)
npm run typecheck      # tsc --noEmit
npm run test           # Vitest unit tests
npm run test:a11y      # Playwright + axe-core smoke (five routes)
npm run migrate:attractions # Phase 2.5: JSON -> Supabase
```

Node 20+ required.

## Environment

Copy `.env.example` to `.env.local`. Only `VITE_`-prefixed vars reach the
browser. The Supabase service-role key is used only by the migration script
and must never be committed or `VITE_`-prefixed. See `SPEC.md` §16.

## Pre-rendering

Static HTML for crawlers and LLM ingestion is produced by
`scripts/prerender.ts` (Playwright postbuild), not a Vite plugin - see
`docs/adr/0002-prerender-and-audit-scope.md`. The Vercel build command should
be `npx playwright install --with-deps chromium && npm run build:prerender`.

## CI

Four workflows gate merges (repo root `.github/workflows`): `ci`, `codeql`,
`security`, `a11y`. All run with `working-directory: salone-explorer`.
