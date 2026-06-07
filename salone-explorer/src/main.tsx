// React entry point (SPEC §19 P3). Data router (createBrowserRouter with
// repository-backed loaders); route config is shared with the SSG renderer
// (src/routes.tsx). When the page was pre-rendered, the loader data is seeded
// from window.__staticRouterHydrationData so useLoaderData() resolves on first
// render. AuthProvider (Phase 6) owns the Supabase session; ToastProvider the
// transient notifications. Per-route <head> metadata is React 19 native
// (SeoHead), so there is no head provider (ADR 0006).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { routes } from './routes';
import { AuthProvider } from './lib/auth/AuthProvider';
import { ToastProvider } from './lib/toast/ToastProvider';

/** The router hydration state the prerender serialized into the page. */
type HydrationData = {
  loaderData: Record<string, unknown>;
  actionData: Record<string, unknown> | null;
  errors: Record<string, unknown> | null;
};

declare global {
  interface Window {
    __staticRouterHydrationData?: HydrationData;
  }
}

const router = createBrowserRouter(routes, {
  hydrationData: window.__staticRouterHydrationData,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
