// Static file server for the a11y gate, mirroring Vercel's routing: serve a
// real file (including a directory's index.html) when one exists, otherwise
// fall back to /index.html (SPA). This lets Playwright/axe test the exact
// prerendered build (vite preview falls back to root index.html for nested
// routes, mis-serving the prerendered pages). No dependencies.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.env.PORT) || 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname.split('?')[0]));
  const candidate = clean === '/' ? '/index.html' : clean;
  let abs = join(distDir, candidate);
  // Path-traversal guard: never escape dist.
  if (!abs.startsWith(distDir)) return join(distDir, 'index.html');
  if (await isFile(abs)) return abs;
  if (await isFile(join(abs, 'index.html'))) return join(abs, 'index.html');
  return join(distDir, 'index.html');
}

const server = createServer(async (req, res) => {
  try {
    const file = await resolveFile(req.url || '/');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, () => console.log(`serve-dist: http://localhost:${port}`));
