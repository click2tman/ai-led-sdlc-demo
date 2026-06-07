// Shared route configuration (SPEC §7). One definition consumed by both the
// client data router (main.tsx, createBrowserRouter) and the build-time SSG
// renderer (entry-server.tsx, createStaticHandler), so client and prerender
// stay in lockstep.
import type { RouteObject } from 'react-router-dom';
import App from './App';
import { HomePage, homeLoader } from '@/pages/HomePage';
import {
  AttractionDetailPage,
  attractionLoader,
} from '@/pages/AttractionDetailPage';
import { AboutPage, aboutLoader } from '@/pages/AboutPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { AccountPage } from '@/pages/AccountPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import type { Attraction } from '@/data/types';
import { homeGraph, attractionGraph, aboutGraph } from '@/seo/graph';

/**
 * Per-route SEO metadata attached via React Router's `handle`. The Document
 * (entry-server) reads `jsonLd` from the deepest matched route and renders the
 * graph in <head> (React 19 does not hoist application/ld+json scripts, so it
 * cannot come from a deep component). Centralising the graph here keeps the
 * page components free of SEO wiring and avoids duplicating the route->graph
 * mapping in the prerender.
 */
export type RouteHandle = {
  jsonLd?: (loaderData: unknown) => Record<string, unknown> | undefined;
};

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        loader: homeLoader,
        handle: { jsonLd: () => homeGraph() } satisfies RouteHandle,
      },
      {
        path: 'attractions/:id',
        element: <AttractionDetailPage />,
        loader: attractionLoader,
        handle: {
          jsonLd: (data) => {
            const attraction = (data as { attraction: Attraction | null } | undefined)
              ?.attraction;
            return attraction ? attractionGraph(attraction) : undefined;
          },
        } satisfies RouteHandle,
      },
      {
        path: 'about',
        element: <AboutPage />,
        loader: aboutLoader,
        handle: { jsonLd: () => aboutGraph() } satisfies RouteHandle,
      },
      { path: 'signin', element: <SignInPage /> },
      { path: 'signup', element: <SignUpPage /> },
      {
        // Client-only protected route; intentionally excluded from the
        // prerender list (scripts/prerender.ts) since it requires a session.
        path: 'account',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
