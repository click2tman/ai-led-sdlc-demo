// Static pre-rendering (SPEC §13.1). Browser-free SSG: consumes the Vite SSR
// bundle (dist-ssr/entry-server.js) produced by `vite build --ssr`, renders
// each public route to static HTML via react-dom/server, and writes
// dist/<route>/index.html for crawlers and LLM ingestion. Runs on the Vercel
// build image with no Chromium dependency (supersedes the Playwright approach
// in ADR 0002).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Attraction } from '../src/data/types';
import type { RenderResult } from '../src/entry-server';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const distDir = resolve(appRoot, 'dist');

const parsed = JSON.parse(
  readFileSync(resolve(appRoot, 'src/data/attractions.json'), 'utf8'),
) as Attraction[];
if (!Array.isArray(parsed) || parsed.some((a) => !/^[a-z0-9-]+$/.test(a.id))) {
  throw new Error('prerender: attractions.json must be an array of records with kebab-case ids.');
}

const routes: string[] = [
  '/',
  '/about',
  '/signin',
  '/signup',
  ...parsed.map((a) => `/attractions/${a.id}`),
];

/** Inject rendered app HTML, Helmet head, and hydration data into the shell. */
function compose(template: string, result: RenderResult): string {
  const { appHtml, helmet, hydrationData } = result;
  const head =
    helmet.title.toString() +
    helmet.meta.toString() +
    helmet.link.toString() +
    helmet.script.toString();
  // Seed the client router with the loader data so useLoaderData() resolves on
  // first render. Escape "<" so the JSON can't break out of the script tag.
  const hydration =
    `<script>window.__staticRouterHydrationData=` +
    `${JSON.stringify(hydrationData).replace(/</g, '\\u003c')};</script>`;
  return template
    // Drop the template's static title/description; Helmet supplies them.
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `${head}</head>`)
    .replace(/(<script type="module")/, `${hydration}$1`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

async function run(): Promise<void> {
  const template = readFileSync(resolve(distDir, 'index.html'), 'utf8');
  const entryUrl = pathToFileURL(resolve(appRoot, 'dist-ssr/entry-server.js')).href;
  const { render } = (await import(entryUrl)) as {
    render: (url: string) => Promise<RenderResult>;
  };

  for (const route of routes) {
    const result = await render(route);
    const html = compose(template, result);
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
