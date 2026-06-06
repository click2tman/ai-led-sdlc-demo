// Attraction detail page (SPEC §9.3). Loads one attraction through the
// repository; renders breadcrumb, gallery, citable fact blocks, hours, FAQ,
// and sources. The first description paragraph and the hours block are
// marked data-speakable for AEO (§13.3). Facts come from the record; all
// labels come from the content layer.
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router-dom';
import { attractions, t } from '@/lib/content';
import type { Attraction } from '@/data/types';
import { attractionPath } from '@/lib/site';
import { SeoHead } from '@/seo/SeoHead';
import { attractionGraph } from '@/seo/graph';
import { RatingBadge } from '@/components/RatingBadge';
import { HoursBlock } from '@/components/HoursBlock';
import { DirectionsButton } from '@/components/DirectionsButton';
import { FaqAccordion } from '@/components/FaqAccordion';
import { SourcesList } from '@/components/SourcesList';
import { buttonVariants } from '@/components/Button';

export async function attractionLoader({
  params,
}: LoaderFunctionArgs): Promise<{ attraction: Attraction | null }> {
  const id = params.id ?? '';
  return { attraction: await attractions.getById(id) };
}

type DetailData = Awaited<ReturnType<typeof attractionLoader>>;

function NotFound() {
  return (
    <>
      <SeoHead
        title={`${t('attraction.notFound.title')} - ${t('app.name')}`}
        description={t('attraction.notFound.body')}
        path="/"
        noindex
      />
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{t('attraction.notFound.title')}</h1>
        <p className="mt-3 text-text-muted">{t('attraction.notFound.body')}</p>
        <Link to="/" className={buttonVariants({ variant: 'primary', className: 'mt-6' })}>
          {t('attraction.notFound.cta')}
        </Link>
      </section>
    </>
  );
}

export function AttractionDetailPage() {
  const { attraction } = useLoaderData() as DetailData;
  if (!attraction) return <NotFound />;

  const paragraphs = attraction.longDescription.split('\n\n');

  return (
    <>
      <SeoHead
        title={`${attraction.name} - ${t('app.name')}`}
        description={attraction.shortDescription}
        path={attractionPath(attraction.id)}
        image={attraction.images[0]}
        type="article"
        jsonLd={attractionGraph(attraction)}
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav aria-label={t('attraction.breadcrumb.attractions')} className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-text-muted">
            <li>
              <Link to="/" className="hover:underline">
                {t('nav.home')}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" className="hover:underline">
                {t('attraction.breadcrumb.attractions')}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text">
              {attraction.name}
            </li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl font-bold md:text-4xl">{attraction.name}</h1>
          <p className="mt-1 text-text-muted">{attraction.location.region}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <RatingBadge rating={attraction.rating} reviewCount={attraction.reviewCount} />
            <ul className="flex flex-wrap gap-1.5">
              {attraction.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-brand-sand px-2.5 py-0.5 text-xs font-medium text-warning"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <section aria-label={t('attraction.gallery.label')} className="mb-8">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {attraction.images.map((src, index) => (
              <li
                key={src}
                className={index === 0 ? 'col-span-2 md:col-span-2 md:row-span-2' : ''}
              >
                <img
                  src={src}
                  alt={`${attraction.name} - ${index + 1}`}
                  width={640}
                  height={360}
                  className="h-full w-full rounded-lg object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <div>
            <div className="prose-sm max-w-none">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-4 text-text"
                  data-speakable={index === 0 ? 'lead' : undefined}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {attraction.faqs && attraction.faqs.length > 0 && (
              <div className="mt-8">
                <FaqAccordion faqs={attraction.faqs} />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <HoursBlock hours={attraction.hours} />
            <DirectionsButton
              location={attraction.location}
              attractionName={attraction.name}
            />
            {attraction.lastReviewed && (
              <p className="text-sm text-text-muted">
                {t('attraction.lastReviewed.label')}: {attraction.lastReviewed}
              </p>
            )}
          </aside>
        </div>

        <div className="mt-10">
          <SourcesList sources={attraction.sources} />
        </div>
      </div>
    </>
  );
}
