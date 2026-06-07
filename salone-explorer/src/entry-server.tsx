// SSR/SSG entry (SPEC §13.1; supersedes the Playwright prerender in ADR 0002).
// Built with `vite build --ssr` so CSS/asset imports resolve, then invoked by
// scripts/prerender.ts. Runs the route loaders through React Router's static
// handler and renders the matched route to an HTML string, capturing the
// Helmet head. No browser required - this runs on the Vercel build image.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
// React Router v7 consolidated the SSR APIs into `react-router`
// (`react-router-dom/server` was removed).
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { routes } from './routes';
import { AuthProvider } from './lib/auth/AuthProvider';
import { ToastProvider } from './lib/toast/ToastProvider';

/** Serializable loader state seeded into the client router on hydration. */
export type HydrationData = {
  loaderData: Record<string, unknown>;
  actionData: Record<string, unknown> | null;
  errors: Record<string, unknown> | null;
};

export type RenderResult = {
  appHtml: string;
  helmet: HelmetServerState;
  hydrationData: HydrationData;
};

/**
 * Render a single route to static HTML.
 * @param url - site-relative path, e.g. "/attractions/tiwai-island"
 */
export async function render(url: string): Promise<RenderResult> {
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`http://localhost${url}`));

  if (context instanceof Response) {
    throw new Error(`Unexpected Response (status ${context.status}) for ${url}`);
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  const helmetContext: { helmet?: HelmetServerState } = {};

  const appHtml = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <AuthProvider>
          <ToastProvider>
            <StaticRouterProvider router={router} context={context} />
          </ToastProvider>
        </AuthProvider>
      </HelmetProvider>
    </StrictMode>,
  );

  if (!helmetContext.helmet) {
    throw new Error(`Helmet context was not populated for ${url}`);
  }

  return {
    appHtml,
    helmet: helmetContext.helmet,
    hydrationData: {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: context.errors,
    },
  };
}
