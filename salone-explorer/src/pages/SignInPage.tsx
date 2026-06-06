// Sign-in page (SPEC §9.6). Form shell only in this phase; Supabase auth is
// wired in Phase 6. noindex because /signin is disallowed in robots.txt (§13.1).
import { t } from '@/lib/content';
import { SeoHead } from '@/seo/SeoHead';
import { AuthForm } from '@/components/AuthForm';

export function SignInPage() {
  return (
    <>
      <SeoHead
        title={`${t('auth.signin.title')} - ${t('app.name')}`}
        description={t('auth.signin.subtitle')}
        path="/signin"
        noindex
      />
      <section className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold">{t('auth.signin.title')}</h1>
        <p className="mt-2 text-text-muted">{t('auth.signin.subtitle')}</p>
        <AuthForm mode="signin" />
      </section>
    </>
  );
}
