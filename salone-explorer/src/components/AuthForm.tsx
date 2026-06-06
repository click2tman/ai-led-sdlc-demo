// Accessible sign-in / sign-up form (SPEC §9.6). DS-style labelled fields
// with correct autocomplete and inputmode (WCAG 1.3.5, 3.3.x; no CAPTCHA,
// paste allowed per 3.3.8). Submits to Supabase via useAuth(); errors map to
// errors.auth.* content keys (mapAuthError) so no English copy lives here.
// When Supabase is not configured, submit announces auth.notEnabled.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t, type StringKey } from '@/lib/content';
import { useAuth } from '@/lib/auth/AuthProvider';
import { mapAuthError } from '@/lib/auth/auth-errors';
import { Button } from './Button';
import { SocialSignInButtons } from './SocialSignInButtons';

type AuthMode = 'signin' | 'signup';

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const { signIn, signUp, configured } = useAuth();
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [noticeKey, setNoticeKey] = useState<StringKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);
    setNoticeKey(null);

    if (!configured) {
      setErrorKey('auth.notEnabled');
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const displayName = String(form.get('displayName') ?? '').trim();

    setSubmitting(true);
    try {
      const session = isSignup
        ? await signUp(email, password, displayName)
        : await signIn(email, password);
      // signUp returns null when email confirmation is required: there is no
      // session yet, so navigating to /account would bounce back to /signin.
      // Show a confirmation notice instead. With confirm-email disabled
      // (SPEC §19 P5) a session is always present and we navigate.
      if (!session) {
        setNoticeKey('auth.signup.checkEmail');
        return;
      }
      navigate('/account');
    } catch (error) {
      setErrorKey(mapAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-1">
            <label htmlFor="displayName" className="text-sm font-medium">
              {t('auth.field.displayName')}
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={100}
              className="min-h-[44px] rounded-md border border-border px-3"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            {t('auth.field.email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            className="min-h-[44px] rounded-md border border-border px-3"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            {t('auth.field.password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            className="min-h-[44px] rounded-md border border-border px-3"
          />
        </div>

        <Button type="submit" block disabled={submitting} aria-busy={submitting}>
          {isSignup ? t('auth.submit.signup') : t('auth.submit.signin')}
        </Button>

        {errorKey && (
          <p role="alert" className="text-sm text-danger">
            {t(errorKey)}
          </p>
        )}

        {noticeKey && (
          <p role="status" className="text-sm text-text-muted">
            {t(noticeKey)}
          </p>
        )}
      </form>

      <SocialSignInButtons />

      <p className="text-sm text-text-muted">
        <Link
          to={isSignup ? '/signin' : '/signup'}
          className="text-brand-accent hover:underline"
        >
          {isSignup ? t('auth.link.toSignin') : t('auth.link.toSignup')}
        </Link>
      </p>
    </div>
  );
}
