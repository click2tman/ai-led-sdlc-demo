# ADR 0006: React 19 upgrade and the SSG per-route head pipeline

- Status: Accepted (human-ratified 2026-06-06; JSON-LD placement: in <head>)
- Date: 2026-06-06
- Deciders: architect agent (proposal); human reviewer to ratify (REQUIRED
  — the author does not approve this ADR)
- Relates to: ADR 0002 (browser-free SSG), ADR 0003 (root Vercel build
  shim), ADR 0004 (Phase 9 reviews / JSON-LD aggregateRating)
- Amends on acceptance: SPEC §3 (dependency set), SPEC §13.1 (head
  mechanism currently names `react-helmet-async`)

## Context

What is true today:

- The app is a **browser-free build-time SSG** (ADR 0002 amendment). The
  flow is: `vite build --ssr src/entry-server.tsx` produces an SSR bundle;
  `scripts/prerender.ts` imports its `render(url)`, renders each public
  route to an HTML string with `react-dom/server` `renderToString`, and
  **injects** the rendered app HTML + a serialized head string into the
  built `dist/index.html` template, writing `dist/<route>/index.html`.
- Per-route head tags (`<title>`, `<meta>` description/canonical/OG/Twitter/
  robots-noindex, and a `<script type="application/ld+json">` graph) are
  produced by `src/seo/SeoHead.tsx` and `src/seo/JsonLd.tsx` using
  `react-helmet-async`'s `<Helmet>`. `entry-server.tsx` wraps the tree in
  `<HelmetProvider context={helmetContext}>` and reads
  `helmetContext.helmet` to serialize the head. `prerender.ts`'s `compose()`
  concatenates `helmet.title/meta/link/script` strings into `<head>`.
- `src/seo/graph.ts` `serializeJsonLd()` escapes `<` to `\u003c`. This is
  the **single XSS control** for JSON-LD and prevents a `</script>`
  breakout from any string node (FAQ answers, descriptions, or — post
  Phase 9 — user-submitted review bodies surfaced in `aggregateRating`/
  `Review`). It must not regress (SPEC §14, §15).
- The client hydrates with `createBrowserRouter` seeded from
  `window.__staticRouterHydrationData` (`src/main.tsx`), also wrapped in
  `<HelmetProvider>`.
- Current deps: `react`/`react-dom` 18.3, `react-helmet-async` 2.0,
  `react-router-dom` 7.17, `vite` 8, `@vitejs/plugin-react` 6.

Forces that apply:

- We want to move to **React 19**.
- `react-helmet-async` 3.0.0 adds React 19 support by **detecting React 19
  at runtime and making `<HelmetProvider>` a transparent passthrough**:
  `<Helmet>` renders real DOM elements and relies on React 19's **native
  hoisting** of `<title>/<meta>/<link>/<script>` to `<head>`. Under React
  19 the server `context` object is **no longer populated** — so
  `helmetContext.helmet` is empty and `entry-server.tsx` throws "Helmet
  context was not populated".
- React 19 native hoisting of `<title>/<meta>/<link>` lands them in
  `<head>` **only when the renderer is producing a full HTML document**
  (the documented `react-dom/static` `prerender` contract renders the
  whole `<html>` tree). Rendering an **app subtree** into a template — what
  `prerender.ts` does today — gives React no `<head>` to hoist into.
- React 19 **does not hoist `<script type="application/ld+json">`**. Only
  scripts with both `src` and `async={true}` are hoisted/deduplicated;
  inline scripts (which JSON-LD is) are rendered **in place**, not moved
  to `<head>`. This is the load-bearing SEO/security constraint: the
  helmet passthrough will not place JSON-LD in `<head>` for us.

The blocker is therefore not "React 19 is incompatible" — it is that our
**subtree-into-template** injection model is incompatible with React 19's
**full-document hoisting** model, and JSON-LD needs explicit placement
regardless.

## Decision

Adopt **React 19 with native document metadata, rendering a full `<html>`
document at prerender time, and removing `react-helmet-async` entirely.**

1. **Head injection (resolves tension 1).** Replace the
   subtree-into-template injection with a **full-document render**.
   `entry-server.tsx` renders a root `Document` component that returns the
   complete `<html><head>…</head><body><div id="root">…</div></body></html>`,
   using **`react-dom/server` `renderToString`** (as shipped). The draft
   proposed `react-dom/static` `prerenderToNodeStream`, but its prelude
   stream type conflicted with the Node collector; `renderToString` performs
   the same React 19 metadata hoisting for a full document, returns a string
   directly, and - since the client uses `createRoot` not `hydrateRoot` -
   leaves harmless hydration markers. The per-route
   `<title>/<meta>/<link>` are emitted as **native React 19 tags** by a
   rewritten `SeoHead` (no `<Helmet>`); React hoists them into the
   document `<head>`. The static head shell that lives in `index.html`
   today (charset, icons, viewport, theme-color, font preconnect/stylesheet)
   moves into the `Document` `<head>` as native tags so it is rendered by
   React rather than string-injected.

   Consequence for the template + inject step: `prerender.ts` **stops doing
   regex string surgery** on `dist/index.html` (no more dropping
   `<title>`/`<meta>` or splicing `head`/`hydration`/`appHtml`). Instead it
   consumes the full HTML document the renderer returns and writes it to
   `dist/<route>/index.html`. The Vite-built asset URLs (hashed JS/CSS) are
   passed to the renderer as `bootstrapModules` / emitted `<link>`/`<script>`
   so the document references the real built assets. The hydration seed
   (`window.__staticRouterHydrationData`) is emitted as a native inline
   `<script>` in the `Document` body (see tension 2 for the escaping rule).

2. **JSON-LD (resolves tension 2 — load-bearing).** Because React 19 does
   **not** hoist inline `<script type="application/ld+json">`, `JsonLd.tsx`
   renders the JSON-LD `<script>` **explicitly inside the document `<head>`**
   (not via hoisting, not via Helmet). The graph is funneled from the page
   through to the `Document`'s `<head>` (e.g. the route loader/page sets the
   graph; `Document` renders it in `<head>`). The body of that script is
   `serializeJsonLd(graph)` with `dangerouslySetInnerHTML` — and
   **`serializeJsonLd` is preserved byte-for-byte**: the `<` → `<`
   escape remains the single XSS control and must keep 100% of its existing
   unit-test coverage. The `__staticRouterHydrationData` seed keeps its own
   existing `</` → `<` escaping. No JSON-LD or hydration JSON reaches
   the document without passing through an escape function. **Stop-and-ask:**
   if funneling the graph to `<head>` is not cleanly expressible without an
   in-`<head>` render, the fallback is to render the JSON-LD `<script>`
   **inline in the body** at the top of the route subtree — SEO validators
   accept JSON-LD anywhere in the document, so this is acceptable, but it is
   a visible deviation from "JSON-LD in `<head>`" and the reviewer must
   choose.

3. **Hydration consistency (resolves tension 3).** With metadata rendered
   as native tags in the tree, the **same `SeoHead`/`JsonLd` components run
   on client and server**, so there is no metadata mismatch by construction.
   `react-helmet-async` is **removed from `main.tsx`, `entry-server.tsx`,
   and `package.json`** — no `<HelmetProvider>` on either side. The client
   continues to hydrate `#root` with `createBrowserRouter` +
   `hydrationData`; the full-document render does **not** switch the client
   to `hydrateRoot(document, …)` (that would require React to own
   `<html>` on the client, a larger change and a hydration-mismatch risk
   against Vite's dev `index.html`). The client keeps hydrating the
   `#root` subtree; React 19 native metadata updates the live `<head>` on
   client navigation exactly as Helmet did.

4. **React 19 runtime deltas (resolves tension 4).**
   - `createRoot` + `StrictMode` are already in use (`main.tsx`) — no
     change.
   - `renderToString` (react-dom/server) renders the full document for the
     SSG path; our loaders are already resolved by the static handler, so no
     async/streaming renderer is needed.
   - **ref-as-prop**: `ScheduleTourModal.tsx` uses a plain `useRef`
     on a native `<dialog>` (`showModal()`/`close()`), not `forwardRef`,
     so the ref change is a no-op for us. `forwardRef` is deprecated-not-
     removed; we have no `forwardRef` in `src/` to migrate.
   - Removed legacy APIs (`ReactDOM.render`, string refs, legacy context,
     `propTypes`/`defaultProps` on function components) are **not used**.
   - Radix accordion, lucide, Radix toast/dialog primitives rely only on
     supported hooks; no removed-API dependency.

5. **Dependency set + peers (resolves tension 5).** Bump to:
   `react`/`react-dom` `^19`, `@types/react`/`@types/react-dom` `^19`.
   **Remove** `react-helmet-async` (and its `ssr.noExternal`
   CJS-interop entry in `vite.config`, ADR 0002). Confirmed peer ranges
   already admit React 19: `@radix-ui/react-accordion@1.2.x`
   (`^19.0` peer), `lucide-react@1.17` (`^19.0.0`), `react-router-dom@7.17`
   (`>=18`), `@testing-library/react@16.3` (`^18 || ^19`),
   `@vitejs/plugin-react@6` (React 19 JSX runtime). **Stop-and-ask:** the
   installed `@testing-library/react` is `16.3.2` while `package.json`
   pins `^16.1.0`; the bump should align the manifest. No `--legacy-peer-
   deps` is expected; if `npm ci` reports any peer conflict the engineer
   stops and reports rather than forcing the install.

6. **a11y / SEO acceptance (resolves tension 6).** Acceptance is unchanged
   in outcome: the prerendered detail page (`/attractions/tiwai-island`)
   must still emit, **in the static HTML**, the `TouristAttraction` graph
   with `speakable` (`SpeakableSpecification`), `aggregateRating`, and
   `Review` nodes (ADR 0004), and `<title>`/`<meta>`/canonical/OG. The
   a11y gate (axe on the five smoke routes) and the SEO validators
   (SPEC §14.2) must pass against the regenerated static files. The
   migration is **not done** until a byte-diff of the prerendered
   `dist/<route>/index.html` head shows parity (same tags, same JSON-LD)
   with the React-18 baseline, modulo asset-hash changes.

## Consequences

Positive:

- React 19 unblocked; metadata becomes a first-class React feature with no
  third-party head library and no runtime-version-detection passthrough.
- `prerender.ts` loses its fragile regex string surgery; the renderer owns
  the whole document, which is more robust and easier to reason about.
- One less production dependency (`react-helmet-async`), one less
  `ssr.noExternal` CJS-interop workaround.
- Client and server render the identical metadata components — mismatch
  risk drops.

Negative / risks (see Risk list):

- Larger blast radius than a version bump: the **render API, the entry,
  and the prerender inject step all change together**. Higher regression
  risk on the SSG output, which is the SEO/AEO surface.
- JSON-LD now depends on **explicit in-`<head>` placement**, not a library;
  if the funnel is done wrong, JSON-LD silently drops from `<head>` and SEO
  regresses without a build error. Mitigated by an assertion in
  `prerender.ts` (fail the build if a route that must carry JSON-LD has no
  `application/ld+json` in its output).
- Full-document rendering must keep the Vite asset graph correct; getting
  the hashed JS/CSS `<link>`/`<script>` references wrong breaks hydration.

Follow-on work:

- Update SPEC §13.1 wording (drops `react-helmet-async`) and SPEC §3
  dependency list on acceptance.
- Update ADR 0002's amendment note (the head is no longer captured via
  Helmet context).
- Add a prerender assertion test that every JSON-LD-bearing route emits a
  non-empty escaped `application/ld+json` block in `<head>`.

## Alternatives considered

- **(a) Keep `react-helmet-async`, pin React 18.** Rejected: the explicit
  goal is to move to React 19.
- **(c) Keep a small head-collection shim under React 19** (custom context
  that gathers tags rendered by `SeoHead` and lets `prerender.ts` inject
  them into the template, preserving subtree rendering). Viable and the
  *smallest* diff to the entry, but it re-implements exactly what React 19
  metadata gives natively, keeps the brittle template regex surgery, and
  still needs a separate path for JSON-LD — net it trades one shim for
  another. Dismissed in favour of using the platform.
- **Client owns the document via `hydrateRoot(document, <Document/>)`.**
  Rejected for now: it forces React to control `<html>`/`<head>` on the
  client and conflicts with Vite's dev-server `index.html`, raising
  hydration-mismatch risk for no SEO benefit (the static head is already
  correct from prerender). Kept as a future option if client-side head
  drift ever appears.
- **Switch fully to a meta-framework SSG (e.g. add a framework router).**
  Rejected: out of scope, large dependency and architecture change, and
  unnecessary — `react-dom/static` covers our needs.

## Sequencing plan

Layers touched: **code only** (SSG pipeline, SEO components, entry,
manifest). **No data, content, Attraction-type, repository-interface, or
Supabase-schema change.** No contract bump.

1. Branch from `dev`: `issue-<num>-react-19-ssg-metadata` (per
   branch-conventions). Open the session.
2. **Deps**: bump `react`/`react-dom`/`@types/*` to `^19`; remove
   `react-helmet-async`; align `@testing-library/react` to installed.
   `npm ci`; stop if any peer conflict (do not `--legacy-peer-deps`).
3. **SeoHead.tsx**: replace `<Helmet>` with native React 19 `<title>`/
   `<meta>`/`<link>` tags. Strings still come from the content layer via
   `t()`; no literals (three-layer rule holds).
4. **JsonLd.tsx**: render the `<script type="application/ld+json">`
   explicitly with `dangerouslySetInnerHTML={{__html: serializeJsonLd(data)}}`;
   **do not touch `graph.ts` `serializeJsonLd`**. Wire the graph to render
   inside the document `<head>`.
5. **Document component + entry-server.tsx**: introduce a `Document` root
   that returns the full `<html>`; render it with `react-dom/server`
   `renderToString`. Remove `HelmetProvider` and the
   `helmetContext` populate-check. Emit the hydration seed as a native
   escaped inline `<script>`.
6. **prerender.ts**: remove the regex template surgery; write the full
   document the renderer returns. Add the JSON-LD-presence assertion (fail
   the build if a JSON-LD route emits none). Keep the kebab-case-id guard.
7. **main.tsx + index.html**: remove `HelmetProvider`; move the static
   head shell into the `Document`; ensure dev `index.html` and the
   prerendered document stay consistent.
8. **vite.config**: drop the `react-helmet-async` `ssr.noExternal` entry.
9. **Verification loop**: lint, `tsc --noEmit`, unit tests (incl. the
   `serializeJsonLd` escaping tests — must stay green), build:prerender,
   then **byte-diff the prerendered `<head>`** for `/`,
   `/attractions/tiwai-island`, `/about` against the React-18 baseline;
   run `test:a11y`; validate detail-page JSON-LD against SPEC §14.2.
10. `/handoff` to a draft PR into `dev`; tag the human reviewer to ratify
    this ADR (Status: Proposed → Accepted) before merge.

Contracts that bump: **none.** Migrations required: **none.** Supabase /
RLS unaffected.
