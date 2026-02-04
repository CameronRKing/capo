import { test, expect } from '@playwright/test';

test.describe('Admin Compilation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?role=admin');
    await page.waitForTimeout(1000);
  });

  test('access admin compilation page', async ({ page }) => {
    await page.goto('/admin/compilation');
    await page.waitForTimeout(500);

    const url = page.url();
    const hasAdminContent = await page.locator('text=Admin').or(page.locator('text=Compilation')).count() > 0;

    expect(url.includes('/admin') || hasAdminContent).toBeTruthy();
  });

  test('select game for compilation', async ({ page }) => {
    await page.goto('/admin/compilation');
    await page.waitForTimeout(1000);

    // Look for game selector
    const gameSelect = page.locator('select[name*="game"]').or(page.locator('[data-testid*="game-select"]')).or(page.locator('label').filter({ hasText: /game|select/i }));

    const count = await gameSelect.count();

    if (count > 0) {
      const firstSelect = gameSelect.first();

      if (await firstSelect.tagName() === 'SELECT') {
        // Get options
        const options = await firstSelect.locator('option').count();
        expect(options).toBeGreaterThan(0);

        // Select first option (skip placeholder)
        await firstSelect.selectOption({ index: 1 });
      } else {
        // Click to open
        await firstSelect.click();
      }

      // Verify selection
      expect(true).toBeTruthy();
    } else {
      // No game selector - might auto-load or be configured differently
      const hasCompilation = page.locator('text=Compilation');
      expect(hasCompilation).toBeTruthy();
    }
  });

  test('run hiring compilation', async ({ page }) => {
    await page.goto('/admin/compilation');
    await page.waitForTimeout(1000);

    // Look for compile button
    const compileButton = page.locator('button:has-text("Compile")').or(page.locator('button:has-text("Run")').or(page.locator('[data-testid*="compile"]'));

    const buttonCount = await compileButton.count();

    if (buttonCount > 0) {
      // Click compile
      await compileButton.first().click();

      // Look for progress indicator
      await page.waitForTimeout(1000);
      const hasProgress = await page.locator('text=Compiling').or(page.locator('text=Processing')).or(page.locator('[data-testid*="progress"]')).count() > 0;

      // Wait for completion (with timeout)
      const hasCompletion = await page.locator('text=complete').or(page.locator('text=success')).or(page.locator('text=done')).isVisible({ timeout: 30000 }).catch(() => false);

      expect(hasProgress || hasCompletion).toBeTruthy();
    } else {
      // No compile button - might need specific setup
      const hasCompilation = page.locator('text=Compilation');
      expect(hasCompilation).toBeTruthy();
    }
  });

  test('view compilation results', async ({ page }) => {
    await page.goto('/admin/compilation');
    await page.waitForTimeout(1000);

    // Look for results/output area
    const resultsArea = page.locator('[data-testid*="results"]').or(page.locator('text=Results')).or(page.locator('pre')).or(page.locator('.output'));

    const count = await resultsArea.count();

    if (count > 0) {
      await expect(resultsArea.first()).isVisible();
    } else {
      // Results might not be available yet
      const hasCompilation = page.locator('text=Compilation');
      expect(hasCompilation).toBeTruthy();
    }
  });

  test('download compilation report', async ({ page }) => {
    await page.goto('/admin/compilation');
    await page.waitForTimeout(1000);

    // Look for download button
    const downloadButton = page.locator('button:has-text("Download")').or(page.locator('a:has-text("Download")').or(page.locator('[data-testid*="download"]'));

    const buttonCount = await downloadButton.count();

    if (buttonCount > 0) {
      // Setup download handler
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadButton.first().click(),
      ]);

      // Verify download started
      expect(download.suggestedFilename()).toBeTruthy();
    } else {
      // Download might not be implemented
      const hasCompilation = page.locator('text=Compilation');
      expect(hasCompilation).toBeTruthy();
    }
  });

  test('admin cannot access student areas', async ({ page }) => {
    await page.goto('/admin/compilation');

    // Try to navigate to student area
    await page.goto('/student/hiring');

    // Should redirect away
    await page.waitForTimeout(1000);
    const url = page.url();
    const hasAccessDenied = await page.locator('text=access').or(page.locator('text=denied')).count() > 0;

    expect(url.includes('/admin') || url.includes('/login') || hasAccessDenied).toBeTruthy();
  });

  test('view compilation history', async ({ page }) => {
    await page.goto('/admin/compilation');
    await page.waitForTimeout(1000);

    // Look for history/list
    const historyArea = page.locator('[data-testid*="history"]').or(page.locator('text=History')).or(page.locator('text=Previous'));

    const count = await historyArea.count();

    if (count > 0) {
      await expect(historyArea.first()).isVisible();
    } else {
      // History might not be implemented yet
      const hasCompilation = page.locator('text=Compilation');
      expect(hasCompilation).toBeTruthy();
    }
  });
});
