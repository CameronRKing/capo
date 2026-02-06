import { test, expect } from '@playwright/test';

test('minimal Playwright test', async ({ page }) => {
  await page.goto('https://example.com');
  const title = await page.title();
  console.log('Page title:', title);
  expect(title).toBe('Example Domain');
});
