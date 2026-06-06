// Unit tests for the Supabase AttractionRepository wiring (Phase 2.5). The
// "not configured" path is exercised hermetically by stubbing the Supabase
// env vars empty, so the result is deterministic whether or not a developer
// has a populated .env.local on disk (Vite loads it into the test env too).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { supabaseAttractionRepository } from '@/lib/content/attractions.supabase';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('supabaseAttractionRepository', () => {
  it('fails fast when Supabase is not configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    await expect(supabaseAttractionRepository.getAll()).rejects.toThrow(
      /Supabase is not configured/,
    );
  });

  it('is import-safe in file mode (module load does not throw)', async () => {
    expect(typeof supabaseAttractionRepository.getById).toBe('function');
  });
});
