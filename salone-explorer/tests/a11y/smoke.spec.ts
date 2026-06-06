// Accessibility smoke tests (SPEC §10.5, §15). Runs axe-core against the five
// public smoke routes and fails on any serious or critical WCAG 2.2 AA
// violation. This is the local mirror of the a11y.yml CI gate.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/attractions/tiwai-island',
  '/about',
  '/signin',
  '/signup',
];

for (const route of ROUTES) {
  test(`no serious or critical a11y violations on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForSelector('main h1');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
}
