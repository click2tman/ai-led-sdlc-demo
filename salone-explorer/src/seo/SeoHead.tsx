// Per-route document head (SPEC §13.1) via React 19 native document metadata.
// React 19 hoists these <title>/<meta>/<link> into <head> during the
// full-document prerender (entry-server -> Document) and on the client after
// navigation - no head library. JSON-LD is NOT emitted here: React 19 does not
// hoist <script type="application/ld+json">, so the graph is placed directly in
// <head> by the Document via the route `handle` (see routes.tsx). All copy is
// passed in by the page from the content layer; no strings here beyond
// Schema/OG property keys.
import { absoluteUrl } from '@/lib/site';
import { t } from '@/lib/content';

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
};

const DEFAULT_OG_IMAGE = '/images/og-default.svg';

export function SeoHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
}: SeoHeadProps) {
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image);
  const siteName = t('app.name');
  return (
    <>
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
    </>
  );
}
