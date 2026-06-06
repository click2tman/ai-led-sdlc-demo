// Image attribution accessor (SPEC §4 sourcing). Attraction photos are
// sourced from Wikimedia Commons under CC/CC0 licenses; this exposes the
// per-attraction credit (author, license, source) so the UI can render the
// required attribution. Data lives in src/data/image-credits.json.
import creditsData from '@/data/image-credits.json';

export type ImageCredit = {
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

const credits = creditsData as Record<string, ImageCredit>;

/** Return the attribution for an attraction's image, or null if none. */
export function getImageCredit(attractionId: string): ImageCredit | null {
  return credits[attractionId] ?? null;
}
