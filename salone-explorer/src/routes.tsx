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

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage />, loader: homeLoader },
      {
        path: 'attractions/:id',
        element: <AttractionDetailPage />,
        loader: attractionLoader,
      },
      { path: 'about', element: <AboutPage />, loader: aboutLoader },
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
