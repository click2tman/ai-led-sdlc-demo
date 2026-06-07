// Static pre-rendering (SPEC §13.1, ADR 0006). Browser-free SSG: consumes the
// Vite SSR bundle (dist-ssr/entry-server.js), which renders each public route
// to a COMPLETE static HTML document (React 19 full-document render, no
// template surgery), and writes dist/<route>/index.html for crawlers and LLM
// ingestion. The hashed client JS/CSS come from the Vite build manifest. A
// JSON-LD presence assertion fails the build if a route that must carry a
// graph emits none in <head>. Runs on the Vercel build image; no Chromium.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Attraction } from '../src/data/types';
import type { Assets, RenderResult } from '../src/entry-server';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const distDir = resolve(appRoot, 'dist');

const parsed = JSON.parse(
  readFileSync(resolve(appRoot, 'src/data/attractions.json'), 'utf8'),
) as Attraction[];
if (!Array.isArray(parsed) || parsed.some((a) => !/^[a-z0-9-]+$/.test(a.id))) {
  throw new Error('prerender: attractions.json must be an array of records with kebab-case ids.');
}

const attractionRoutes = parsed.map((a) => `/attractions/${a.id}`);
const routes: string[] = ['/', '/about', '/signin', '/signup', ...attractionRoutes];

// Routes whose <head> must carry a JSON-LD graph (ADR 0006 assertion). signin
// and signup are noindex and carry none.
const jsonLdRoutes = new Set<string>(['/', '/about', ...attractionRoutes]);

type ManifestEntry = { file: string; css?: string[]; isEntry?: boolean };

/** Hashed entry JS + CSS from dist/.vite/manifest.json (build.manifest). */
function readAssets(): Assets {
  const manifest = JSON.parse(
    readFileSync(resolve(distDir, '.vite/manifest.json'), 'utf8'),
  ) as Record<string, ManifestEntry>;
  const entry = Object.values(manifest).find((e) => e.isEntry);
  if (!entry) {
    throw new Error('prerender: no isEntry record in dist/.vite/manifest.json.');
  }
  return {
    js: [`/${entry.file}`],
    css: (entry.css ?? []).map((file) => `/${file}`),
  };
}

async function run(): Promise<void> {
  const assets = readAssets();
  const entryUrl = pathToFileURL(resolve(appRoot, 'dist-ssr/entry-server.js')).href;
  const { render } = (await import(entryUrl)) as {
    render: (url: string, assets: Assets) => Promise<RenderResult>;
  };

  for (const route of routes) {
    const { html } = await render(route, assets);

    if (jsonLdRoutes.has(route)) {
      const headEnd = html.indexOf('</head>');
      if (headEnd === -1) {
        throw new Error(`prerender: route ${route} produced no </head> - render broken.`);
      }
      if (!html.slice(0, headEnd).includes('application/ld+json')) {
        throw new Error(`prerender: route ${route} is missing its JSON-LD in <head>.`);
      }
    }

    const outDir = route === '/' ? distDir : resolve(distDir, route.slice(1));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'index.html'), html);
    console.log(`prerender: ${route}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
