// File-based AttractionRepository (Phase 1 default). Reads the bundled
// src/data/attractions.json and validates its shape at the boundary so a
// malformed record fails fast and loudly rather than rendering silently
// broken pages (engineering-principles: validate at boundaries, fail fast).
import attractionsData from '@/data/attractions.json';
import type { Attraction } from '@/data/types';
import type { AttractionRepository } from './attractions';

/**
 * Validate that a raw JSON value is a well-formed Attraction array. Throws
 * with a precise message identifying the offending record and field. The
 * data is static and bundled, so this runs once and a failure is a build
 * or authoring error, not a runtime user error.
 */
function validateAttractions(raw: unknown): Attraction[] {
  if (!Array.isArray(raw)) {
    throw new Error('attractions.json must be an array of Attraction records.');
  }
  raw.forEach((record, index) => {
    const where = `attractions.json[${index}]`;
    const a = record as Partial<Attraction>;
    const requireString = (field: keyof Attraction) => {
      if (typeof a[field] !== 'string' || (a[field] as string).length === 0) {
        throw new Error(`${where}.${String(field)} must be a non-empty string.`);
      }
    };
    requireString('id');
    requireString('name');
    requireString('shortDescription');
    requireString('longDescription');
    if (!a.location || typeof a.location.latitude !== 'number' || typeof a.location.longitude !== 'number') {
      throw new Error(`${where}.location must include numeric latitude and longitude.`);
    }
    if (!a.hours || typeof a.hours.open !== 'string' || typeof a.hours.close !== 'string') {
      throw new Error(`${where}.hours must include open and close times.`);
    }
    if (typeof a.rating !== 'number' || a.rating < 0 || a.rating > 5) {
      throw new Error(`${where}.rating must be a number between 0 and 5.`);
    }
    if (typeof a.reviewCount !== 'number' || a.reviewCount < 0) {
      throw new Error(`${where}.reviewCount must be a non-negative number.`);
    }
    if (!Array.isArray(a.images) || !Array.isArray(a.tags) || !Array.isArray(a.sources)) {
      throw new Error(`${where} must include images, tags, and sources arrays.`);
    }
    if (a.sources.length === 0) {
      throw new Error(`${where}.sources must list at least one source URL (SPEC §4).`);
    }
  });
  return raw as Attraction[];
}

const attractions = validateAttractions(attractionsData);

export const fileAttractionRepository: AttractionRepository = {
  async getAll() {
    return [...attractions].sort((a, b) => a.name.localeCompare(b.name));
  },
  async getById(id) {
    return attractions.find((a) => a.id === id) ?? null;
  },
};
