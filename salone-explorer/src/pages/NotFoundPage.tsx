// 404 page (SPEC §7). noindex; offers a route back to Home.
import { Link } from 'react-router-dom';
import { t } from '@/lib/content';
import { SeoHead } from '@/seo/SeoHead';
import { buttonVariants } from '@/components/Button';

export function NotFoundPage() {
  return (
    <>
      <SeoHead
        title={`${t('notFound.title')} - ${t('app.name')}`}
        description={t('notFound.body')}
        path="/"
        noindex
      />
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold">{t('notFound.title')}</h1>
        <p className="mt-3 text-text-muted">{t('notFound.body')}</p>
        <Link to="/" className={buttonVariants({ variant: 'primary', className: 'mt-6' })}>
          {t('notFound.cta')}
        </Link>
      </section>
    </>
  );
}
