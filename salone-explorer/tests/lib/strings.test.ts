// Unit tests for the t() string indirection (SPEC §5.2.3).
import { describe, it, expect } from 'vitest';
import { t } from '@/lib/content/strings';
import type { StringKey } from '@/lib/content/strings';

describe('t()', () => {
  it('resolves a known content key', () => {
    expect(t('app.name')).toBe('Salone Explorer');
  });

  it('renders the verbatim full disclaimer (SPEC §17)', () => {
    expect(t('disclaimer.full')).toContain('TpGroup (SL) Limited');
    expect(t('disclaimer.full')).toContain('No payments or real bookings');
  });

  it('throws in development for an unknown key', () => {
    expect(() => t('nope.not.a.key' as StringKey)).toThrow(/Missing content string/);
  });
});
