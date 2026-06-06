// Route guard (SPEC §19 P6, §20 Phase 2: "/account redirects to /signin
// while signed out"). Waits out the initial session lookup, then renders the
// protected content for a signed-in user or redirects to /signin otherwise.
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t } from '@/lib/content';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p role="status" className="mx-auto max-w-md px-4 py-12 text-text-muted">
        {t('common.loading')}
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
