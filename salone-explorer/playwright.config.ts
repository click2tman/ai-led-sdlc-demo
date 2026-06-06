// Playwright config for the accessibility smoke gate (SPEC §15 a11y.yml).
// Serves the built app with `vite preview` and runs axe-core across the five
// smoke routes. Mirrors the CI workflow added in Phase 4.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Serve the built dist/ the way Vercel does (real files + directory
    // index, then SPA fallback) so the gate tests the prerendered artifact.
    command: 'node scripts/serve-dist.mjs',
    port: PORT,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
