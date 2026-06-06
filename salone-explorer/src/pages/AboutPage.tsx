// About page (SPEC §9.7): FambulTik/TpGroup attribution, the full §17
// disclaimer (mandatory third placement), data-source credits, and the DS
// credit link. All copy from the content layer.
import { attractions, t } from '@/lib/content';
import { useLoaderData } from 'react-router-dom';
import type { Attraction } from '@/data/types';
import { SeoHead } from '@/seo/SeoHead';
import { aboutGraph } from '@/seo/graph';

export async function aboutLoader(): Promise<{ items: Attraction[] }> {
  return { items: await attractions.getAll() };
}

type AboutData = Awaited<ReturnType<typeof aboutLoader>>;

export function AboutPage() {
  const { items } = useLoaderData() as AboutData;
  // Unique source URLs across all attractions, for the credits list.
  const sources = Array.from(new Set(items.flatMap((a) => a.sources))).sort();

  return (
    <>
      <SeoHead
        title={`${t('about.title')} - ${t('app.name')}`}
        description={t('brand.site.description')}
        path="/about"
        jsonLd={aboutGraph()}
      />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-4xl">{t('about.title')}</h1>

        <section aria-labelledby="about-brand-heading" className="mt-8">
          <h2 id="about-brand-heading" className="text-xl font-semibold">
            {t('about.brand.heading')}
          </h2>
          <p className="mt-2 text-text">{t('about.brand')}</p>
        </section>

        <section aria-labelledby="about-disclaimer-heading" className="mt-8">
          <h2 id="about-disclaimer-heading" className="text-xl font-semibold">
            {t('about.disclaimer.heading')}
          </h2>
          <p className="mt-2 text-text-muted">{t('disclaimer.full')}</p>
        </section>

        <section aria-labelledby="about-sources-heading" className="mt-8">
          <h2 id="about-sources-heading" className="text-xl font-semibold">
            {t('about.sources.heading')}
          </h2>
          <p className="mt-2 text-text-muted">{t('about.sources.intro')}</p>
          <ul className="mt-3 flex flex-col gap-1">
            {sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent underline underline-offset-2 hover:no-underline"
                >
                  {url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-credits-heading" className="mt-8">
          <h2 id="about-credits-heading" className="text-xl font-semibold">
            {t('about.credits.heading')}
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-text-muted">
            <li>
              <a
                href="https://design.tpgroupsl.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                {t('about.credits.designSystem')}
              </a>
            </li>
            <li>{t('about.credits.builtWith')}</li>
          </ul>
        </section>
      </article>
    </>
  );
}
