/// <reference types="vitest/config" />
// Vite + Vitest config: React plugin, "@/" -> src alias, jsdom unit-test env.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    // Bundle these into the SSG output (scripts/prerender.ts) rather than
    // externalizing them: they are CommonJS and Node's ESM named-import
    // interop does not resolve their named exports at runtime.
    noExternal: ['react-helmet-async'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/a11y/**', 'node_modules/**'],
  },
});
