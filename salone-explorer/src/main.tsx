// React entry point (SPEC §19 P3): data router (createBrowserRouter with
// repository-backed loaders) wrapped in HelmetProvider for per-route head
// management. Route config is shared with the SSG renderer (src/routes.tsx).
// When the page was pre-rendered, the loader data is seeded from
// window.__staticRouterHydrationData so useLoaderData() resolves on first
// render. AuthProvider is added in Phase 6.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import { routes } from './routes';
import type { HydrationData } from './entry-server';

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
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </StrictMode>,
);
