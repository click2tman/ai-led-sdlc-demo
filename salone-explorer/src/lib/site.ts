// Site-level configuration derived from the environment. Holds the
// canonical origin (VITE_SITE_URL, SPEC §16) used for canonical URLs,
// OG/Twitter tags, sitemap.xml, llms.txt, and JSON-LD @id values. No
// user-facing copy lives here - that is the content layer.

const FALLBACK_ORIGIN = 'https://slint-ai-led-sdlc.tpgroupsl.com';

/** Canonical site origin without a trailing slash. */
export const siteUrl: string = (
  import.meta.env.VITE_SITE_URL ?? FALLBACK_ORIGIN
).replace(/\/+$/, '');

/**
 * Build an absolute URL for a site-relative path.
 * @param path - a path beginning with "/" (e.g. "/attractions/tiwai-island")
 */
export function absoluteUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalised}`;
}

/** Canonical path for an attraction detail route. */
export function attractionPath(id: string): string {
  return `/attractions/${id}`;
}
