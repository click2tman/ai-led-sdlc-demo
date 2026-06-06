// Home page (SPEC §9.2): hero band + responsive attraction grid. Data is
// loaded through the repository via a route loader; every string comes from
// the content layer. The hero subtitle is the AEO definitional lead.
import { useLoaderData } from 'react-router-dom';
import { attractions, t } from '@/lib/content';
import type { Attraction } from '@/data/types';
import { SeoHead } from '@/seo/SeoHead';
import { homeGraph } from '@/seo/graph';
import { AttractionCard } from '@/components/AttractionCard';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { buttonVariants } from '@/components/Button';

export async function homeLoader(): Promise<{ items: Attraction[] }> {
  return { items: await attractions.getAll() };
}

type HomeData = Awaited<ReturnType<typeof homeLoader>>;

export function HomePage() {
  const { items } = useLoaderData() as HomeData;
  return (
    <>
      <SeoHead
        title={`${t('app.name')} - ${t('app.tagline')}`}
        description={t('brand.site.description')}
        path="/"
        jsonLd={homeGraph()}
      />
      <DisclaimerBanner />

      <section className="bg-tpgroup-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h1 className="max-w-3xl text-4xl font-bold md:text-5xl">
            {t('home.hero.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90" data-speakable="lead">
            {t('home.hero.subtitle')}
          </p>
          <a
            href="#attractions"
            className={buttonVariants({ variant: 'primary', className: 'mt-8' })}
          >
            {t('home.hero.cta')}
          </a>
        </div>
      </section>

      <section
        id="attractions"
        aria-labelledby="attractions-heading"
        className="mx-auto max-w-6xl px-4 py-12"
      >
        <h2 id="attractions-heading" className="text-2xl font-bold md:text-3xl">
          {t('home.attractions.heading')}
        </h2>
        <p className="mt-2 max-w-2xl text-text-muted">{t('home.attractions.intro')}</p>

        {items.length === 0 ? (
          <p className="mt-8 text-text-muted">{t('home.attractions.empty')}</p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((attraction) => (
              <li key={attraction.id}>
                <AttractionCard attraction={attraction} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
