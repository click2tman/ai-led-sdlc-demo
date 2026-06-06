// React entry point (SPEC §19 P3): data router (createBrowserRouter with
// repository-backed loaders) wrapped in HelmetProvider for per-route head
// management. AuthProvider is added in Phase 6.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import { HomePage, homeLoader } from '@/pages/HomePage';
import {
  AttractionDetailPage,
  attractionLoader,
} from '@/pages/AttractionDetailPage';
import { AboutPage, aboutLoader } from '@/pages/AboutPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const router = createBrowserRouter([
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

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
