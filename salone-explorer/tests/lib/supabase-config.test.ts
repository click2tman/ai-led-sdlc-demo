// Unit tests for isSupabaseConfigured (SPEC §5.3, §19 P5). The presence gate
// lets AuthProvider treat "no Supabase" as a valid signed-out state without a
// silent fallback. It must be true only when both anon vars are set.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { isSupabaseConfigured } from '@/lib/supabase';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isSupabaseConfigured', () => {
  it('is false when the env vars are absent', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('is false when only the URL is set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('is true when both anon vars are set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    expect(isSupabaseConfigured()).toBe(true);
  });
});
