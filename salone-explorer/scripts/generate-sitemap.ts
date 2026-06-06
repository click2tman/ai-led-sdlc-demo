// Build-time SEO generator (SPEC §13). Reads the attractions data and emits
// dist/sitemap.xml and dist/llms.txt from the canonical origin (VITE_SITE_URL).
// Run after `vite build`. Kept in sync with the data layer, not hand-edited.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Attraction } from '../src/data/types';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const distDir = resolve(appRoot, 'dist');

const FALLBACK_ORIGIN = 'https://slint-ai-led-sdlc.tpgroupsl.com';
const siteUrl = (process.env.VITE_SITE_URL ?? FALLBACK_ORIGIN).replace(/\/+$/, '');

const attractions = JSON.parse(
  readFileSync(resolve(appRoot, 'src/data/attractions.json'), 'utf8'),
) as Attraction[];

const today = new Date().toISOString().slice(0, 10);

type SitemapEntry = { path: string; lastmod: string; priority: string };

const entries: SitemapEntry[] = [
  { path: '/', lastmod: today, priority: '1.0' },
  { path: '/about', lastmod: today, priority: '0.5' },
  ...attractions.map((a) => ({
    path: `/attractions/${a.id}`,
    lastmod: a.lastReviewed ?? today,
    priority: '0.8',
  })),
];

function buildSitemap(): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${siteUrl}${e.path}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildLlmsTxt(): string {
  const lines: string[] = [
    '# Salone Explorer',
    '',
    '> A FambulTik guide to the tourist attractions of Sierra Leone, published by TpGroup (SL) Limited for demonstration and educational purposes. Information is paraphrased from public sources and may be out of date.',
    '',
    '## Attractions',
    '',
  ];
  for (const a of attractions) {
    lines.push(`- [${a.name}](${siteUrl}/attractions/${a.id}): ${a.shortDescription}`);
  }
  lines.push('', '## About', '', `- [About Salone Explorer](${siteUrl}/about)`, '');
  return lines.join('\n');
}

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}
writeFileSync(resolve(distDir, 'sitemap.xml'), buildSitemap());
writeFileSync(resolve(distDir, 'llms.txt'), buildLlmsTxt());

console.log(`generate-sitemap: wrote sitemap.xml (${entries.length} urls) and llms.txt`);
