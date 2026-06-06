// Accessible sign-in / sign-up form shell (SPEC §9.6). Renders DS-style
// labelled fields with correct autocomplete and inputmode (WCAG 1.3.5,
// 3.3.x; no CAPTCHA, paste allowed per 3.3.8). The Supabase submit handler
// is wired in Phase 6; until then submit announces a status message via the
// content layer rather than silently doing nothing.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/content';
import { Button } from './Button';

type AuthMode = 'signin' | 'signup';

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const [notice, setNotice] = useState('');
  const isSignup = mode === 'signup';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Phase 6 replaces this with supabase.auth.signInWithPassword / signUp.
    setNotice(t('auth.notEnabled'));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
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

      <Button type="submit" block>
        {isSignup ? t('auth.submit.signup') : t('auth.submit.signin')}
      </Button>

      {notice && (
        <p role="status" className="text-sm text-warning">
          {notice}
        </p>
      )}

      <p className="text-sm text-text-muted">
        <Link
          to={isSignup ? '/signin' : '/signup'}
          className="text-brand-accent hover:underline"
        >
          {isSignup ? t('auth.link.toSignin') : t('auth.link.toSignup')}
        </Link>
      </p>
    </form>
  );
}
