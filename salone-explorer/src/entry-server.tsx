// SSG entry (SPEC §13.1, ADR 0006; supersedes the Helmet-context approach).
// Renders each route as a FULL <html> document via react-dom/static
// `prerenderToNodeStream`, so React 19 hoists the native <title>/<meta>/<link>
// emitted by SeoHead into <head>. No react-helmet-async. JSON-LD is placed in
// <head> explicitly from the matched route's `handle` (React 19 does not hoist
// application/ld+json). Built with `vite build --ssr`, invoked by
// scripts/prerender.ts; no browser.
import { StrictMode, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router';
import { routes, type RouteHandle } from './routes';
import { AuthProvider } from './lib/auth/AuthProvider';
import { ToastProvider } from './lib/toast/ToastProvider';
import { JsonLd } from './seo/JsonLd';

/** Hashed Vite assets for the client entry, from dist/.vite/manifest.json. */
export type Assets = { js: string[]; css: string[] };

export type RenderResult = { html: string };

type StaticContext = {
  matches: { route: { id: string; handle?: unknown } }[];
  loaderData: Record<string, unknown>;
  actionData: unknown;
  errors: unknown;
};

/** JSON-LD graph for the deepest matched route that declares a `jsonLd` handle. */
function jsonLdForContext(context: StaticContext): Record<string, unknown> | undefined {
  let graph: Record<string, unknown> | undefined;
  for (const match of context.matches) {
    const builder = (match.route.handle as RouteHandle | undefined)?.jsonLd;
    if (builder) graph = builder(context.loaderData[match.route.id]);
  }
  return graph;
}

/** Serialize the router hydration state, escaping "<" so it cannot break out
 * of the inline <script> (same control as the JSON-LD serializer). */
function hydrationScript(context: StaticContext): string {
  const data = {
    loaderData: context.loaderData,
    actionData: context.actionData,
    errors: context.errors,
  };
  return `window.__staticRouterHydrationData=${JSON.stringify(data).replace(/</g, '\\u003c')};`;
}

/**
 * Full <html> document for one route. The static head shell mirrors
 * index.html (charset, icons, viewport, theme, fonts) as native tags so React
 * owns the whole document; SeoHead's per-route metadata is hoisted into <head>
 * by React 19; JSON-LD, the hashed CSS/JS, and the hydration seed are explicit.
 */
function Document({
  children,
  jsonLd,
  assets,
  hydration,
}: {
  children: ReactNode;
  jsonLd?: Record<string, unknown>;
  assets: Assets;
  hydration: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#011B54" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {assets.css.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {jsonLd && <JsonLd data={jsonLd} />}
      </head>
      <body>
        <div id="root">{children}</div>
        <script dangerouslySetInnerHTML={{ __html: hydration }} />
        {assets.js.map((src) => (
          <script key={src} type="module" src={src} />
        ))}
      </body>
    </html>
  );
}

/**
 * Render a route to a complete static HTML document.
 * @param url - site-relative path, e.g. "/attractions/tiwai-island"
 * @param assets - hashed entry JS/CSS from the Vite manifest
 */
export async function render(url: string, assets: Assets): Promise<RenderResult> {
  const handler = createStaticHandler(routes);
  const result = await handler.query(new Request(`http://localhost${url}`));
  if (result instanceof Response) {
    throw new Error(`Unexpected Response (status ${result.status}) for ${url}`);
  }
  const context = result as unknown as StaticContext;

  const router = createStaticRouter(handler.dataRoutes, result);

  // renderToString renders the full <html> document; React 19 hoists the
  // native <title>/<meta>/<link> from SeoHead into <head>. The client uses
  // createRoot (not hydrateRoot), so server hydration markers are harmless.
  const html = renderToString(
    <StrictMode>
      <Document
        jsonLd={jsonLdForContext(context)}
        assets={assets}
        hydration={hydrationScript(context)}
      >
        <AuthProvider>
          <ToastProvider>
            <StaticRouterProvider router={router} context={result} />
          </ToastProvider>
        </AuthProvider>
      </Document>
    </StrictMode>,
  );

  return { html: `<!DOCTYPE html>${html}` };
}
