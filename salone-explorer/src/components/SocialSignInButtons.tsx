// Social sign-in buttons (SPEC §9.6, §20 Phase 6). Google / Facebook /
// LinkedIn via supabase.auth.signInWithOAuth (provider config + secrets live
// in the Supabase dashboard, never in the client - SPEC §16). Labels come
// from the content layer; the flow redirects, so a failure before redirect is
// surfaced to the parent via onError.
import { useState } from 'react';
import { useAuth, type OAuthProvider } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';
import { mapAuthError } from '@/lib/auth/auth-errors';
import { Button } from './Button';

type ProviderConfig = { provider: OAuthProvider; label: StringKey };

const PROVIDERS: ProviderConfig[] = [
  { provider: 'google', label: 'auth.social.google' },
  { provider: 'facebook', label: 'auth.social.facebook' },
  { provider: 'linkedin_oidc', label: 'auth.social.linkedin' },
];

export function SocialSignInButtons({
  onError,
}: {
  onError: (messageKey: StringKey) => void;
}) {
  const { signInWithOAuth, configured } = useAuth();
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  async function handleClick(provider: OAuthProvider) {
    if (!configured) {
      onError('auth.notEnabled');
      return;
    }
    setPending(provider);
    try {
      await signInWithOAuth(provider);
      // On success the browser navigates away; no further UI update needed.
    } catch (error) {
      setPending(null);
      onError(mapAuthError(error));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-text-muted">
        {t('auth.social.heading')}
      </p>
      {PROVIDERS.map(({ provider, label }) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          block
          onClick={() => handleClick(provider)}
          disabled={pending !== null}
          aria-busy={pending === provider}
        >
          {t(label)}
        </Button>
      ))}
    </div>
  );
}
