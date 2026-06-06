// Unit tests for the Supabase AttractionRepository wiring (Phase 2.5). With no
// Supabase env configured (the test default), calling a method must fail fast
// with a clear message rather than silently returning empty data.
import { describe, it, expect } from 'vitest';
import { supabaseAttractionRepository } from '@/lib/content/attractions.supabase';

describe('supabaseAttractionRepository', () => {
  it('fails fast when Supabase is not configured', async () => {
    await expect(supabaseAttractionRepository.getAll()).rejects.toThrow(
      /Supabase is not configured/,
    );
  });

  it('is import-safe in file mode (module load does not throw)', async () => {
    expect(typeof supabaseAttractionRepository.getById).toBe('function');
  });
});
