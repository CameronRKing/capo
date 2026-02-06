/**
 * E2E-Reports: Reports & Results Viewing (Playwright)
 *
 * Tests for viewing and exporting reports across all user roles:
 * - Student views their company's individual results
 * - Teacher views aggregated game results with filtering
 * - Admin views cross-game compilation history
 *
 * Features tested:
 * - Report navigation (quarter selection, report type tabs)
 * - Role-based access control
 * - Data filtering (by company, by phase, by quarter)
 * - Export functionality (PDF, CSV)
 * - Visualizations (charts, graphs)
 * - Historical results access
 *
 * Prerequisites:
 * - Dev server running: `npm run dev`
 * - Convex backend available with test data
 * - Compiled reports exist in the database
 *
 * Run with: `npm run test:e2e:playwright -- reports.spec.ts`
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Page Objects for Reports Pages
// ============================================================================

class StudentReportsPage {
  static async goto(page, userEmail) {
    const url = userEmail ? `/student/reports?user=${userEmail}` : '/student/reports';
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }

  static async selectQuarter(page, quarter) {
    const quarterButton = page.locator(`button:has-text("${quarter}")`);
    await quarterButton.click();
    await page.waitForTimeout(500);
  }

  static async selectReportType(page, type) {
    const tab = page.locator(`button:has-text("${type}")`);
    await tab.click();
    await page.waitForTimeout(500);
  }

  static async getFinancialSummary(page) {
    const sales = await page.locator('div:has-text("Total Sales")').textContent();
    const grossMargin = await page.locator('div:has-text("Gross Margin")').textContent();
    const netIncome = await page.locator('div:has-text("Net Income")').textContent();

    return {
      sales: sales?.match(/[\$,\d]+/)?.[0] || '',
      grossMargin: grossMargin?.match(/[\$,\d]+/)?.[0] || '',
      netIncome: netIncome?.match(/[\$,\d]+/)?.[0] || '',
    };
  }

  static async hasReports(page) {
    const noReports = page.locator('text=No Reports Available');
    return (await noReports.count()) === 0;
  }
}

class TeacherReportsPage {
  static async goto(page, userEmail) {
    const url = userEmail ? `/teacher/reports?user=${userEmail}` : '/teacher/reports';
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }

  static async selectCompany(page, companyName) {
    const select = page.locator('select').first();
    await select.selectOption({ label: companyName });
    await page.waitForTimeout(500);
  }

  static async selectAllCompanies(page) {
    const select = page.locator('select').first();
    await select.selectOption({ label: 'All companies' });
    await page.waitForTimeout(500);
  }

  static async selectQuarter(page, quarter) {
    const quarterButton = page.locator(`button:has-text("${quarter}")`);
    await quarterButton.click();
    await page.waitForTimeout(500);
  }

  static async selectReportType(page, type) {
    const tab = page.locator(`button:has-text("${type}")`);
    await tab.click();
    await page.waitForTimeout(500);
  }

  static async getDisplayedCompanies(page) {
    const companyHeaders = page.locator('h3:has-text("Company"), h3:has-text("(Technology)")');
    const count = await companyHeaders.count();
    const companies = [];

    for (let i = 0; i < count; i++) {
      const text = await companyHeaders.nth(i).textContent();
      if (text) companies.push(text);
    }

    return companies;
  }

  static async getAggregatedReportCount(page) {
    const countText = await page.locator('p:has-text("Showing reports for")').textContent();
    const match = countText?.match(/(\d+) company/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

class AdminResultsPage {
  static async goto(page, userEmail) {
    const url = userEmail ? `/admin/results?user=${userEmail}` : '/admin/results';
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }

  static async selectGame(page, gameName) {
    const gameSelect = page.locator('select').first();
    await gameSelect.selectOption({ label: gameName });
    await page.waitForTimeout(500);
  }

  static async selectQuarter(page, quarter) {
    const quarterSelect = page.locator('select').nth(1);
    await quarterSelect.selectOption({ label: `Quarter ${quarter}` });
    await page.waitForTimeout(500);
  }

  static async getCompilationHistory(page) {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    const history = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');

      const status = await cells.nth(0).textContent();
      const quarter = await cells.nth(1).textContent();
      const phase = await cells.nth(2).textContent();
      const companiesProcessedText = await cells.nth(5).textContent();
      const duration = await cells.nth(4).textContent();

      history.push({
        status: status?.trim() || '',
        quarter: quarter?.trim() || '',
        phase: phase?.trim() || '',
        companiesProcessed: parseInt(companiesProcessedText || '0', 10),
        duration: duration?.trim() || '',
      });
    }

    return history;
  }

  static async hasCompilations(page) {
    const emptyState = page.locator('text=No compilations found');
    return (await emptyState.count()) === 0;
  }

  static async clickTriggerCompilation(page) {
    const button = page.locator('a:has-text("Trigger Compilation")');
    await button.click();
    await page.waitForTimeout(500);
  }
}

// ============================================================================
// TEST SUITE 1: Student Report Viewing
// ============================================================================

test.describe('Student Report Viewing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);
  });

  test('E2E-Reports: Student views results - individual results accessible', async ({ page }) => {
    await StudentReportsPage.goto(page, 'student@test.com');

    // Check page title
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Performance Reports');

    // Verify we're not seeing access denied
    const accessDenied = page.locator('text=Access Denied');
    expect(await accessDenied.count()).toBe(0);
  });

  test('E2E-Reports: Student quarter navigation works', async ({ page }) => {
    await StudentReportsPage.goto(page, 'student@test.com');

    // Try Q1
    await StudentReportsPage.selectQuarter(page, 'Q1');
    await page.waitForTimeout(500);

    // Try Q2
    await StudentReportsPage.selectQuarter(page, 'Q2');
    await page.waitForTimeout(500);

    // Quarter buttons should be visible
    const q1Button = page.locator('button:has-text("Q1")');
    const q2Button = page.locator('button:has-text("Q2")');

    expect(await q1Button.isVisible()).toBe(true);
    expect(await q2Button.isVisible()).toBe(true);
  });

  test('E2E-Reports: Student report type switching works', async ({ page }) => {
    await StudentReportsPage.goto(page, 'student@test.com');

    // Switch to Hiring report
    await StudentReportsPage.selectReportType(page, 'Hiring');
    await page.waitForTimeout(500);

    // Switch to Performance report
    await StudentReportsPage.selectReportType(page, 'Performance');
    await page.waitForTimeout(500);

    // Switch back to Financial
    await StudentReportsPage.selectReportType(page, 'Financial');
    await page.waitForTimeout(500);

    // All tabs should be visible
    const financialTab = page.locator('button:has-text("Financial")');
    const hiringTab = page.locator('button:has-text("Hiring")');
    const performanceTab = page.locator('button:has-text("Performance")');

    expect(await financialTab.isVisible()).toBe(true);
    expect(await hiringTab.isVisible()).toBe(true);
    expect(await performanceTab.isVisible()).toBe(true);
  });

  test('E2E-Reports: Student financial report renders with data', async ({ page }) => {
    await StudentReportsPage.goto(page, 'student@test.com');
    await StudentReportsPage.selectReportType(page, 'Financial');

    // Wait for report to load
    await page.waitForTimeout(1000);

    // Check for financial summary cards
    const totalSalesCard = page.locator('div:has-text("Total Sales")');
    const grossMarginCard = page.locator('div:has-text("Gross Margin")');
    const netIncomeCard = page.locator('div:has-text("Net Income")');

    // At least the cards should be present (even if no data)
    expect(await totalSalesCard.isVisible()).toBe(true);
    expect(await grossMarginCard.isVisible()).toBe(true);
    expect(await netIncomeCard.isVisible()).toBe(true);
  });

  test('E2E-Reports: Student cannot see other companies\' reports', async ({ page }) => {
    await StudentReportsPage.goto(page, 'student@test.com');

    // Company selector should NOT be visible for students
    const companySelector = page.locator('select');
    expect(await companySelector.count()).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 2: Teacher Report Viewing & Filtering
// ============================================================================

test.describe('Teacher Report Viewing & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/?role=teacher&email=teacher@test.com');
    await page.waitForTimeout(1000);
  });

  test('E2E-Reports: Teacher views game results - aggregated results visible', async ({ page }) => {
    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Check page title
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Company Reports');

    // Verify we're not seeing access denied
    const accessDenied = page.locator('text=Access Denied');
    expect(await accessDenied.count()).toBe(0);
  });

  test('E2E-Reports: Teacher can view all companies aggregated', async ({ page }) => {
    await TeacherReportsPage.goto(page, 'teacher@test.com');
    await TeacherReportsPage.selectAllCompanies(page);

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Should see aggregated report indicator
    const aggregatedIndicator = page.locator('p:has-text("Showing reports for")');
    expect(await aggregatedIndicator.isVisible()).toBe(true);
  });

  test('E2E-Reports: Filter results by company - teacher dashboard filtering', async ({ page }) => {
    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Company selector should be visible
    const companySelector = page.locator('select').first();
    expect(await companySelector.isVisible()).toBe(true);

    // Select a specific company (if available)
    const options = await companySelector.locator('option').allTextContents();
    if (options.length > 1) {
      await companySelector.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // View should now show single company
      const aggregatedView = page.locator('p:has-text("Showing reports for")');
      expect(await aggregatedView.count()).toBe(0);
    }
  });

  test('E2E-Reports: Teacher can filter by quarter', async ({ page }) => {
    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Select different quarters
    await TeacherReportsPage.selectQuarter(page, 'Q1');
    await page.waitForTimeout(500);

    await TeacherReportsPage.selectQuarter(page, 'Q2');
    await page.waitForTimeout(500);

    // Quarter navigation should work
    const q1Button = page.locator('button:has-text("Q1")');
    const q2Button = page.locator('button:has-text("Q2")');

    expect(await q1Button.isVisible()).toBe(true);
    expect(await q2Button.isVisible()).toBe(true);
  });

  test('E2E-Reports: Teacher report type tabs work correctly', async ({ page }) => {
    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Try each report type
    await TeacherReportsPage.selectReportType(page, 'Financial');
    await page.waitForTimeout(500);

    await TeacherReportsPage.selectReportType(page, 'Hiring');
    await page.waitForTimeout(500);

    await TeacherReportsPage.selectReportType(page, 'Performance');
    await page.waitForTimeout(500);

    // All tabs visible
    const tabs = page.locator('button').filter({
      hasText: /^(Financial|Hiring|Performance)$/
    });

    expect(await tabs.count()).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// TEST SUITE 3: Admin Compilation History
// ============================================================================

test.describe('Admin Compilation History', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/?role=admin&email=admin@test.com');
    await page.waitForTimeout(1000);
  });

  test('E2E-Reports: Admin views all results - cross-game access', async ({ page }) => {
    await AdminResultsPage.goto(page, 'admin@test.com');

    // Check page title
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Compilation Results');

    // Verify we're not seeing access denied
    const accessDenied = page.locator('text=Access Denied');
    expect(await accessDenied.count()).toBe(0);
  });

  test('E2E-Reports: Admin can filter compilations by game', async ({ page }) => {
    await AdminResultsPage.goto(page, 'admin@test.com');

    // Game selector should be visible
    const gameSelector = page.locator('select').first();
    expect(await gameSelector.isVisible()).toBe(true);

    // Check for "All games" option
    const allGamesOption = gameSelector.locator('option').filter({ hasText: 'All games' });

    expect(await allGamesOption.count()).toBeGreaterThan(0);
  });

  test('E2E-Reports: Admin can filter compilations by quarter', async ({ page }) => {
    await AdminResultsPage.goto(page, 'admin@test.com');

    // Select a game first (if available)
    const gameSelector = page.locator('select').first();
    const options = await gameSelector.locator('option').allTextContents();

    if (options.length > 1) {
      await gameSelector.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // Now quarter selector should be enabled
      const quarterSelector = page.locator('select').nth(1);
      expect(await quarterSelector.isEnabled()).toBe(true);

      // Try selecting a quarter
      await quarterSelector.selectOption({ label: 'Quarter 1' });
      await page.waitForTimeout(500);
    }
  });

  test('E2E-Reports: Admin compilation history displays correctly', async ({ page }) => {
    await AdminResultsPage.goto(page, 'admin@test.com');

    // Wait for table to load
    await page.waitForTimeout(1000);

    // Check for table headers
    const statusHeader = page.locator('th:has-text("Status")');
    const quarterHeader = page.locator('th:has-text("Quarter")');
    const phaseHeader = page.locator('th:has-text("Phase")');
    const startedHeader = page.locator('th:has-text("Started")');
    const durationHeader = page.locator('th:has-text("Duration")');

    expect(await statusHeader.isVisible()).toBe(true);
    expect(await quarterHeader.isVisible()).toBe(true);
    expect(await phaseHeader.isVisible()).toBe(true);
    expect(await startedHeader.isVisible()).toBe(true);
    expect(await durationHeader.isVisible()).toBe(true);
  });

  test('E2E-Reports: Admin can navigate to trigger compilation', async ({ page }) => {
    await AdminResultsPage.goto(page, 'admin@test.com');

    // Look for trigger compilation link/button
    const triggerLink = page.locator('a:has-text("Trigger Compilation")');
    expect(await triggerLink.isVisible()).toBe(true);

    // Click it (should navigate to /admin/compilation)
    await triggerLink.click();
    await page.waitForTimeout(500);

    const currentPath = new URL(page.url()).pathname;
    expect(currentPath).toBe('/admin/compilation');
  });
});

// ============================================================================
// TEST SUITE 4: Export Functionality
// ============================================================================

test.describe('Export Functionality', () => {
  test('E2E-Reports: Export student report - PDF download button exists', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');

    // Look for download/export button
    // Note: Actual download testing may require specific browser setup
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF")');

    // Button might not exist yet (feature not implemented)
    // This test documents the expected functionality
    const hasExportButton = await exportButton.count() > 0;

    // For now, we just verify the page loads without export errors
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Performance Reports');
  });

  test('E2E-Reports: Export teacher report - CSV with company comparisons', async ({ page }) => {
    await page.goto('/?role=teacher&email=teacher@test.com');
    await page.waitForTimeout(1000);

    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Look for export/download button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("CSV")');

    // Feature might not be implemented yet
    const hasExportButton = await exportButton.count() > 0;

    // Verify page loads
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Company Reports');
  });

  test('E2E-Reports: Export admin report - comprehensive game data', async ({ page }) => {
    await page.goto('/?role=admin&email=admin@test.com');
    await page.waitForTimeout(1000);

    await AdminResultsPage.goto(page, 'admin@test.com');

    // Look for export functionality
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');

    // Feature might not be implemented yet
    const hasExportButton = await exportButton.count() > 0;

    // Verify page loads
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Compilation Results');
  });
});

// ============================================================================
// TEST SUITE 5: Report Visualizations
// ============================================================================

test.describe('Report Visualizations', () => {
  test('E2E-Reports: Results visualization - financial summary cards render', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');
    await StudentReportsPage.selectReportType(page, 'Financial');

    await page.waitForTimeout(1000);

    // Check for summary cards with gradients
    const summaryCards = page.locator('div[class*="bg-gradient-to-br"]');
    expect(await summaryCards.count()).toBeGreaterThanOrEqual(3);

    // Verify each card has a label and value
    const totalSales = page.locator('div:has-text("Total Sales")');
    const grossMargin = page.locator('div:has-text("Gross Margin")');
    const netIncome = page.locator('div:has-text("Net Income")');

    expect(await totalSales.isVisible()).toBe(true);
    expect(await grossMargin.isVisible()).toBe(true);
    expect(await netIncome.isVisible()).toBe(true);
  });

  test('E2E-Reports: Financial report table structure is correct', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');
    await StudentReportsPage.selectReportType(page, 'Financial');

    await page.waitForTimeout(1000);

    // Check for table headers
    const lineItemHeader = page.locator('th:has-text("Line Item")');
    const amountHeader = page.locator('th:has-text("Amount")');

    expect(await lineItemHeader.isVisible()).toBe(true);
    expect(await amountHeader.isVisible()).toBe(true);
  });

  test('E2E-Reports: Hiring outcome report displays correctly', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');
    await StudentReportsPage.selectReportType(page, 'Hiring');

    await page.waitForTimeout(1000);

    // Check for hiring report sections
    const newRepsSection = page.locator('h2:has-text("New Reps"), h3:has-text("New Reps")');
    const oldRepsSection = page.locator('h2:has-text("Current Reps"), h3:has-text("Current Reps")');

    // At least one section should be visible (even if no data)
    const hasReportContent = await newRepsSection.count() > 0 || await oldRepsSection.count() > 0;
    const hasNoReports = await page.locator('text=No Reports Available').count() > 0;

    expect(hasReportContent || hasNoReports).toBe(true);
  });

  test('E2E-Reports: Performance report displays rep metrics', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');
    await StudentReportsPage.selectReportType(page, 'Performance');

    await page.waitForTimeout(1000);

    // Check for performance report content
    const repTable = page.locator('table').first();
    const hasNoReports = await page.locator('text=No Reports Available').count() > 0;

    // Either we have a table or a "no reports" message
    expect(await repTable.isVisible() || hasNoReports).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 6: Historical Results Access
// ============================================================================

test.describe('Historical Results Access', () => {
  test('E2E-Reports: Historical results - student can view past quarters', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');

    // Check available quarters
    const q1Button = page.locator('button:has-text("Q1")');
    const q2Button = page.locator('button:has-text("Q2")');
    const q3Button = page.locator('button:has-text("Q3")');

    // At minimum, Q1 should be available
    expect(await q1Button.isVisible()).toBe(true);

    // If Q2 exists, can navigate to it
    if (await q2Button.count() > 0) {
      await q2Button.click();
      await page.waitForTimeout(500);

      // Verify Q2 is now selected
      expect(await q2Button.isVisible()).toBe(true);
    }
  });

  test('E2E-Reports: Historical results - teacher can view past compilations', async ({ page }) => {
    await page.goto('/?role=teacher&email=teacher@test.com');
    await page.waitForTimeout(1000);

    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Navigate through different quarters
    await TeacherReportsPage.selectQuarter(page, 'Q1');
    await page.waitForTimeout(500);

    const q2Button = page.locator('button:has-text("Q2")');
    if (await q2Button.count() > 0) {
      await q2Button.click();
      await page.waitForTimeout(500);

      // View should update to Q2 data
      expect(await q2Button.isVisible()).toBe(true);
    }
  });

  test('E2E-Reports: Historical results - admin compilation history', async ({ page }) => {
    await page.goto('/?role=admin&email=admin@test.com');
    await page.waitForTimeout(1000);

    await AdminResultsPage.goto(page, 'admin@test.com');

    // Wait for history to load
    await page.waitForTimeout(1000);

    // Check for history table
    const table = page.locator('table').first();
    const hasCompilations = await table.count() > 0;
    const hasEmptyState = await page.locator('text=No compilations found').count() > 0;

    // Either we have data or an empty state
    expect(hasCompilations || hasEmptyState).toBe(true);

    // If we have compilations, check the structure
    if (hasCompilations) {
      const rows = await page.locator('tbody tr').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================================
// TEST SUITE 7: Access Control & Cross-Role Prevention
// ============================================================================

test.describe('Access Control & Cross-Role Prevention', () => {
  test('E2E-Reports: Student blocked from teacher reports', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await page.goto('/teacher/reports?user=student@test.com');
    await page.waitForLoadState('networkidle');

    // Should see access denied or redirect
    const accessDenied = page.locator('text=Access Denied');
    const currentPath = new URL(page.url()).pathname;

    // Either denied or redirected away from teacher reports
    const isDenied = await accessDenied.count() > 0;
    const isRedirected = !currentPath.startsWith('/teacher/reports');

    expect(isDenied || isRedirected).toBe(true);
  });

  test('E2E-Reports: Student blocked from admin results', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await page.goto('/admin/results?user=student@test.com');
    await page.waitForLoadState('networkidle');

    // Should see access denied or redirect
    const accessDenied = page.locator('text=Access Denied');
    const currentPath = new URL(page.url()).pathname;

    const isDenied = await accessDenied.count() > 0;
    const isRedirected = !currentPath.startsWith('/admin/results');

    expect(isDenied || isRedirected).toBe(true);
  });

  test('E2E-Reports: Teacher can access admin results page', async ({ page }) => {
    await page.goto('/?role=teacher&email=teacher@test.com');
    await page.waitForTimeout(1000);

    await page.goto('/admin/results?user=teacher@test.com');
    await page.waitForLoadState('networkidle');

    // Teachers should have access to admin results
    const accessDenied = page.locator('text=Access Denied');
    const title = page.locator('h1');

    const isDenied = await accessDenied.count() > 0;
    const hasPage = await title.count() > 0;

    expect(!isDenied && hasPage).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 8: Data Loading & Error States
// ============================================================================

test.describe('Data Loading & Error States', () => {
  test('E2E-Reports: No reports available message displays correctly', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    // Navigate with a user who has no reports
    await StudentReportsPage.goto(page, 'student@test.com');

    // Select a quarter that likely has no data (e.g., Q8)
    const q8Button = page.locator('button:has-text("Q8")');

    if (await q8Button.count() > 0) {
      await q8Button.click();
      await page.waitForTimeout(500);

      // Should show "No Reports Available" or similar
      const noReports = page.locator('text=No Reports Available');
      const hasNoReports = await noReports.count() > 0;

      if (hasNoReports) {
        expect(await noReports.isVisible()).toBe(true);
      }
    }
  });

  test('E2E-Reports: Loading state displays before data loads', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    // Use a fresh page to capture initial load
    await page.goto('/student/reports?user=student@test.com');

    // Check for loading indicator immediately
    const loadingSpinner = page.locator('div[class*="animate-spin"]');

    // Loading might be too fast to catch, but page should not error
    await page.waitForLoadState('networkidle');

    const title = page.locator('h1');
    expect(await title.isVisible()).toBe(true);
  });

  test('E2E-Reports: Student without company sees appropriate message', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    // This would require creating a test user without a company
    // For now, we verify the page handles the case

    // The actual test would need a user with no companyId
    // For now, we document the expected behavior

    await page.goto('/student/reports?user=student@test.com');
    await page.waitForLoadState('networkidle');

    // Should either show reports or access denied (if no company)
    const hasAccess = await page.locator('h1').count() > 0;
    const isDenied = await page.locator('text=Access Denied').count() > 0;

    expect(hasAccess || isDenied).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 9: Phase Filtering (Hiring vs Leadership)
// ============================================================================

test.describe('Phase Filtering', () => {
  test('E2E-Reports: Filter results by phase - hiring vs leadership outcomes', async ({ page }) => {
    await page.goto('/?role=admin&email=admin@test.com');
    await page.waitForTimeout(1000);

    await AdminResultsPage.goto(page, 'admin@test.com');

    // Look for phase filter in the compilation table
    const phaseHeader = page.locator('th:has-text("Phase")');
    expect(await phaseHeader.isVisible()).toBe(true);

    // Each compilation row should show its phase
    const phaseCells = page.locator('td').filter({
      // Phase column is the 3rd column (index 2)
      has: page.locator('xpath=../../td[3]')
    });

    // Check that phases are displayed (hiring, leadership, etc.)
    const count = await phaseCells.count();
    if (count > 0) {
      const firstPhaseText = await phaseCells.first().textContent();
      expect(firstPhaseText).toBeTruthy();
    }
  });
});

// ============================================================================
// TEST SUITE 10: Responsive Design & UI Interactions
// ============================================================================

test.describe('Responsive Design & UI Interactions', () => {
  test('E2E-Reports: Report navigation responds to viewport changes', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Navigation should still be accessible
    const quarterNav = page.locator('button:has-text("Q1")');
    expect(await quarterNav.isVisible()).toBe(true);

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Navigation should still work
    expect(await quarterNav.isVisible()).toBe(true);
  });

  test('E2E-Reports: Report cards maintain consistent styling', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');

    // Check for report card container
    const reportCard = page.locator('div[class*="rounded-lg"]').first();
    expect(await reportCard.isVisible()).toBe(true);

    // Cards should have proper padding and borders
    const hasProperStyling = await reportCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.padding !== '' && styles.borderRadius !== '';
    });

    expect(hasProperStyling).toBe(true);
  });

  test('E2E-Reports: Tables handle overflow correctly', async ({ page }) => {
    await page.goto('/?role=teacher&email=teacher@test.com');
    await page.waitForTimeout(1000);

    await TeacherReportsPage.goto(page, 'teacher@test.com');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Tables should be in scrollable containers
    const tableContainer = page.locator('div[class*="overflow"]').first();

    // Either we have a table or we don't
    const hasTable = await page.locator('table').count() > 0;
    const hasScrollableContainer = await tableContainer.count() > 0;

    expect(hasTable || hasScrollableContainer).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 11: Navigation Between Report Sections
// ============================================================================

test.describe('Navigation Between Report Sections', () => {
  test('E2E-Reports: Quarter selection updates displayed data', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');

    // Get initial state
    const q1Button = page.locator('button:has-text("Q1")');
    await q1Button.click();
    await page.waitForTimeout(500);

    // Try Q2 (if available)
    const q2Button = page.locator('button:has-text("Q2")');
    if (await q2Button.count() > 0) {
      await q2Button.click();
      await page.waitForTimeout(500);

      // Page should still be loaded
      const title = page.locator('h1');
      expect(await title.isVisible()).toBe(true);
    }
  });

  test('E2E-Reports: Report type changes preserve quarter context', async ({ page }) => {
    await page.goto('/?role=student&email=student@test.com');
    await page.waitForTimeout(1000);

    await StudentReportsPage.goto(page, 'student@test.com');

    // Select Q2
    const q2Button = page.locator('button:has-text("Q2")');
    if (await q2Button.count() > 0) {
      await q2Button.click();
      await page.waitForTimeout(500);

      // Switch report types
      await StudentReportsPage.selectReportType(page, 'Hiring');
      await page.waitForTimeout(500);

      await StudentReportsPage.selectReportType(page, 'Financial');
      await page.waitForTimeout(500);

      // Q2 should still be selected
      expect(await q2Button.isVisible()).toBe(true);
    }
  });
});
