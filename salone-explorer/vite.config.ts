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
  build: {
    // Emit dist/.vite/manifest.json so the prerender (scripts/prerender.ts)
    // resolves the hashed entry JS + CSS for the full-document render
    // (ADR 0006) without parsing dist/index.html.
    manifest: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/a11y/**', 'node_modules/**'],
  },
});
