// Email copy resolver (ADR 0007 D2). A tiny t() shim over the generated
// email-copy.json snapshot of the content layer's email.* keys, mirroring the
// app's t(): obj[key] lookup, throw on a missing key. Single source of copy is
// src/content/strings.en.json; this snapshot is built by scripts/
// build-email-copy.ts and kept in sync by a CI drift check. Pure TS (no Deno
// globals) so the app's vitest + tsc cover it via test imports.
import copy from './email-copy.json' with { type: 'json' };

export type EmailCopyKey = keyof typeof copy;

/** Resolve an email.* content key; throws on a missing key (fail fast). */
export function t(key: EmailCopyKey): string {
  const value = (copy as Record<string, string>)[key];
  if (value === undefined) {
    throw new Error(`email copy missing key: ${String(key)}`);
  }
  return value;
}
