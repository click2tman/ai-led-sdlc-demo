// Per-route document head (SPEC §13.1): title, meta description, canonical,
// Open Graph, and Twitter Card. Optionally attaches a JSON-LD graph. All
// copy is passed in by the page from the content layer; this component holds
// no strings of its own beyond Schema/OG property keys.
import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/lib/site';
import { t } from '@/lib/content';
import { JsonLd } from './JsonLd';

type SeoHeadProps = {
  /** <= 60 chars recommended */
  title: string;
  /** <= 160 chars recommended */
  description: string;
  /** site-relative path for the canonical URL */
  path: string;
  /** site-relative OG image path */
  image?: string;
  /** og:type, defaults to "website" */
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};

const DEFAULT_OG_IMAGE = '/images/og-default.svg';

export function SeoHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image);
  const siteName = t('app.name');
  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {noindex && <meta name="robots" content="noindex, nofollow" />}

        <meta property="og:type" content={type} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      {jsonLd && <JsonLd data={jsonLd} />}
    </>
  );
}
