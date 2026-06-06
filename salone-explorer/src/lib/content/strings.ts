// String indirection (SPEC §5.2.3). Every user-facing string flows through
// t(key); components never inline copy. Strings live in
// src/content/strings.en.json and never contain HTML - compose rich text in
// components from multiple keys. This is the i18n on-ramp (add strings.kri.json).
import en from '@/content/strings.en.json';

export type StringKey = keyof typeof en;

/**
 * Resolve a content key to its string. In development an unknown key throws
 * so missing copy is caught immediately; in production it falls back to the
 * provided fallback or the key itself rather than crashing a page.
 *
 * @param key - dot-notation content key (e.g. "nav.home")
 * @param fallback - optional text used when the key is absent
 */
export function t(key: StringKey, fallback?: string): string {
  const value = en[key];
  if (value === undefined) {
    if (import.meta.env.DEV) {
      throw new Error(`Missing content string for key: ${String(key)}`);
    }
    return fallback ?? String(key);
  }
  return value;
}
