// Schema.org JSON-LD @graph builders (SPEC §14). Each page emits a graph of
// linked entities (Organization, TouristInformationCenter, WebSite, WebPage,
// BreadcrumbList, TouristAttraction, FAQPage) plus SpeakableSpecification for
// AEO (§13.3). Human-readable names come from the content layer via t();
// only Schema.org type keywords are inlined here.
import type { Attraction } from '@/data/types';
import { absoluteUrl, siteUrl, attractionPath } from '@/lib/site';
import { t } from '@/lib/content';
import reviewsSnapshot from '@/data/reviews.snapshot.json';

type JsonLdNode = Record<string, unknown>;

/** Per-attraction review aggregate baked at build time (ADR 0004 D3). */
type AttractionSnapshot = {
  count: number;
  mean: number;
  recent: { rating: number; body: string; createdAt: string }[];
};

// Build-time snapshot of published reviews. Empty ({}) when Supabase was
// unconfigured at build, in which case aggregateRating falls back to the
// static attraction.rating/reviewCount.
const snapshot = reviewsSnapshot as Record<string, AttractionSnapshot>;

/** A pseudonymous Review node (ADR 0004 D6: no author PII). */
function reviewNode(review: {
  rating: number;
  body: string;
  createdAt: string;
}): JsonLdNode {
  return {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.body,
    datePublished: review.createdAt.slice(0, 10),
    author: { '@type': 'Person', name: t('reviews.author.generic') },
  };
}

const ORG_ID = `${siteUrl}/#organization`;
const TIC_ID = `${siteUrl}/#tourist-info`;
const WEBSITE_ID = `${siteUrl}/#website`;
const DESTINATION_ID = `${siteUrl}/#sierra-leone`;

/** Publisher: TpGroup (SL) Limited. */
function organization(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: t('brand.publisher'),
    description: t('brand.org.description'),
    url: siteUrl,
    brand: { '@type': 'Brand', name: t('brand.name') },
  };
}

/** FambulTik / Salone Explorer as a tourist information centre. */
function touristInfoCenter(): JsonLdNode {
  return {
    '@type': 'TouristInformationCenter',
    '@id': TIC_ID,
    name: t('app.name'),
    description: t('brand.site.description'),
    url: siteUrl,
    parentOrganization: { '@id': ORG_ID },
    areaServed: { '@id': DESTINATION_ID },
  };
}

function website(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: t('app.name'),
    url: siteUrl,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
  };
}

/** TouristDestination "Sierra Leone" that attractions are contained in. */
function destination(): JsonLdNode {
  return {
    '@type': 'TouristDestination',
    '@id': DESTINATION_ID,
    name: t('brand.destination.name'),
    url: siteUrl,
  };
}

function breadcrumb(items: { name: string; path: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function webPage(args: {
  path: string;
  name: string;
  description: string;
  breadcrumbItems: { name: string; path: string }[];
}): JsonLdNode {
  const url = absoluteUrl(args.path);
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: args.name,
    description: args.description,
    isPartOf: { '@id': WEBSITE_ID },
    breadcrumb: breadcrumb(args.breadcrumbItems),
    inLanguage: 'en',
  };
}

function openingHoursSpecification(attraction: Attraction): JsonLdNode | undefined {
  const { open, close, daysOpen } = attraction.hours;
  if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close) || open === close) {
    return undefined;
  }
  const spec: JsonLdNode = {
    '@type': 'OpeningHoursSpecification',
    opens: open,
    closes: close,
  };
  if (/daily/i.test(daysOpen)) {
    spec.dayOfWeek = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
  }
  return spec;
}

/** TouristAttraction node with geo, rating, hours, image, and AEO speakable. */
export function touristAttraction(attraction: Attraction): JsonLdNode {
  const url = absoluteUrl(attractionPath(attraction.id));
  const node: JsonLdNode = {
    '@type': 'TouristAttraction',
    '@id': `${url}#attraction`,
    name: attraction.name,
    description: attraction.shortDescription,
    url,
    image: attraction.images.map((src) => absoluteUrl(src)),
    address: {
      '@type': 'PostalAddress',
      addressRegion: attraction.location.region,
      addressCountry: 'SL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: attraction.location.latitude,
      longitude: attraction.location.longitude,
    },
    containedInPlace: { '@id': DESTINATION_ID },
    keywords: attraction.tags.join(', '),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable="lead"]', '[data-speakable="facts"]'],
    },
  };
  const hours = openingHoursSpecification(attraction);
  if (hours) node.openingHoursSpecification = hours;
  if (attraction.videoUrl) {
    node.video = {
      '@type': 'VideoObject',
      name: attraction.name,
      contentUrl: attraction.videoUrl,
    };
  }
  // Prefer the build-time review snapshot (real published reviews) for
  // aggregateRating + Review nodes; fall back to the static seed rating when
  // the snapshot has no data for this attraction (ADR 0004 D3).
  const reviews = snapshot[attraction.id];
  if (reviews && reviews.count > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviews.mean,
      reviewCount: reviews.count,
      bestRating: 5,
      worstRating: 1,
    };
    if (reviews.recent.length > 0) {
      node.review = reviews.recent.map(reviewNode);
    }
  } else if (attraction.reviewCount > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: attraction.rating,
      reviewCount: attraction.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  if (attraction.lastReviewed) {
    node.dateModified = attraction.lastReviewed;
  }
  return node;
}

function faqPage(attraction: Attraction): JsonLdNode | undefined {
  if (!attraction.faqs || attraction.faqs.length === 0) return undefined;
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(attractionPath(attraction.id))}#faq`,
    mainEntity: attraction.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

function wrap(nodes: (JsonLdNode | undefined)[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter((n): n is JsonLdNode => Boolean(n)),
  };
}

/**
 * Serialize a JSON-LD graph for embedding in a <script type="application/
 * ld+json"> tag. Escapes "<" to < so any string node - an FAQ answer, a
 * description, or a user-submitted review body - containing "</script>" cannot
 * break out of the script element. "<" is valid inside JSON-LD. This is the
 * single XSS control for JSON-LD; JsonLd.tsx uses it.
 */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Graph for the Home page. */
export function homeGraph(): JsonLdNode {
  return wrap([
    organization(),
    touristInfoCenter(),
    website(),
    destination(),
    webPage({
      path: '/',
      name: t('app.name'),
      description: t('home.hero.subtitle'),
      breadcrumbItems: [{ name: t('nav.home'), path: '/' }],
    }),
  ]);
}

/** Graph for an attraction detail page. */
export function attractionGraph(attraction: Attraction): JsonLdNode {
  return wrap([
    organization(),
    website(),
    destination(),
    webPage({
      path: attractionPath(attraction.id),
      name: attraction.name,
      description: attraction.shortDescription,
      breadcrumbItems: [
        { name: t('nav.home'), path: '/' },
        { name: attraction.name, path: attractionPath(attraction.id) },
      ],
    }),
    touristAttraction(attraction),
    faqPage(attraction),
  ]);
}

/** Graph for the About page. */
export function aboutGraph(): JsonLdNode {
  return wrap([
    organization(),
    website(),
    webPage({
      path: '/about',
      name: t('about.title'),
      description: t('brand.site.description'),
      breadcrumbItems: [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.about'), path: '/about' },
      ],
    }),
  ]);
}
