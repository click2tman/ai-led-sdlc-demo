// Unit tests for the file-based AttractionRepository: ordering, lookup,
// and the seed dataset invariants from SPEC §6.2.
import { describe, it, expect } from 'vitest';
import { fileAttractionRepository } from '@/lib/content/attractions.file';

describe('fileAttractionRepository', () => {
  it('returns all eight seed attractions', async () => {
    const all = await fileAttractionRepository.getAll();
    expect(all).toHaveLength(8);
  });

  it('orders attractions alphabetically by name', async () => {
    const all = await fileAttractionRepository.getAll();
    const names = all.map((a) => a.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('finds an attraction by id', async () => {
    const tiwai = await fileAttractionRepository.getById('tiwai-island');
    expect(tiwai?.name).toBe('Tiwai Island Wildlife Sanctuary');
  });

  it('returns null for an unknown id', async () => {
    expect(await fileAttractionRepository.getById('does-not-exist')).toBeNull();
  });

  it('gives every attraction at least one source URL (SPEC §4)', async () => {
    const all = await fileAttractionRepository.getAll();
    for (const a of all) {
      expect(a.sources.length).toBeGreaterThanOrEqual(1);
      for (const url of a.sources) {
        expect(url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('keeps every rating within 0..5', async () => {
    const all = await fileAttractionRepository.getAll();
    for (const a of all) {
      expect(a.rating).toBeGreaterThanOrEqual(0);
      expect(a.rating).toBeLessThanOrEqual(5);
    }
  });
});
