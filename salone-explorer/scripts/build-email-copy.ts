// Build the email-copy snapshot (ADR 0007 D2). Extracts the email.* subset of
// the content layer (src/content/strings.en.json) into a JSON that the Deno
// Edge Function imports, so email copy stays single-sourced in the content
// layer and the function never hard-codes English. A CI drift check
// (`npm run build:email-copy` then `git diff --exit-code`) fails if the
// snapshot is stale. Generated artifact - do not hand-edit.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');

const strings = JSON.parse(
  readFileSync(resolve(appRoot, 'src/content/strings.en.json'), 'utf8'),
) as Record<string, string>;

const emailCopy = Object.fromEntries(
  Object.entries(strings)
    .filter(([key]) => key.startsWith('email.'))
    .sort(([a], [b]) => a.localeCompare(b)),
);

if (Object.keys(emailCopy).length === 0) {
  throw new Error('build-email-copy: no email.* keys found in strings.en.json.');
}

const outDir = resolve(appRoot, 'supabase/functions/_shared');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, 'email-copy.json'),
  `${JSON.stringify(emailCopy, null, 2)}\n`,
  'utf8',
);
console.log(`build-email-copy: wrote ${Object.keys(emailCopy).length} email.* keys.`);
