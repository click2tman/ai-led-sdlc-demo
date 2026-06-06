// Static pre-rendering (SPEC §13.1; ADR 0002). Replaces the unmaintained
// vite-plugin-prerender. After `vite build`, this serves dist/ with Vite's
// preview server and uses Playwright (already a project dependency) to load
// each public route, wait for it to render, and write the fully-rendered
// HTML back into dist as <route>/index.html for crawlers and LLM ingestion.
import { preview } from 'vite';
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Attraction } from '../src/data/types';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const distDir = resolve(appRoot, 'dist');

const attractions = JSON.parse(
  readFileSync(resolve(appRoot, 'src/data/attractions.json'), 'utf8'),
) as Attraction[];

const routes: string[] = [
  '/',
  '/about',
  ...attractions.map((a) => `/attractions/${a.id}`),
];

async function run(): Promise<void> {
  const server = await preview({ preview: { port: 4318 } });
  const base = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '');
  if (!base) throw new Error('prerender: could not resolve preview server URL.');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    for (const route of routes) {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('main h1', { timeout: 15000 });
      const html = `<!doctype html>\n${await page.evaluate(
        () => document.documentElement.outerHTML,
      )}`;
      const outDir = route === '/' ? distDir : resolve(distDir, route.slice(1));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'index.html'), html);
      console.log(`prerender: ${route}`);
    }
  } finally {
    await browser.close();
    await new Promise<void>((res) => server.httpServer.close(() => res()));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
