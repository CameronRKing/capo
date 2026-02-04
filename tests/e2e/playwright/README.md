# Playwright E2E Tests

Standalone end-to-end tests using Playwright for true browser automation testing.

## Overview

These are **real E2E tests** that run against a running frontend server. Unlike the Vitest browser mode tests (which are component tests with mocks), these tests:

- Run against a real frontend server (via Docker or production URL)
- Test full user workflows from browser perspective
- Use Playwright's powerful automation APIs
- Support multiple browsers (Chrome, Firefox)
- Include screenshots, videos, and traces on failure
- Can test against production Convex deployment

## Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   npm run test:e2e:playwright:install
   ```

2. **Start frontend server**:
   - Option A: Let Playwright auto-start Docker container (default)
   - Option B: Use production URL: `BASE_URL=https://your-frontend-url.com npm run test:e2e:playwright`
   - Option C: Start backend manually (see below)

3. **Backend setup**:
   - For local testing: Start Convex backend: `npm run dev:backend &`
   - For production testing: Tests run against `charming-bass-286` Convex deployment

## Test Files

| Test File | Description | Key Workflows |
|-----------|-------------|---------------|
| `auth.spec.ts` | Authentication flow | Magic link login, validation, access control |
| `access-request.spec.ts` | Access request form | Form submission, validation, role selection |
| `role-based-navigation.spec.ts` | Role-based routing | Admin/Teacher/Student redirects, access control |
| `student-hiring.spec.ts` | Student hiring decisions | Form filling, validation, submission |
| `student-leadership.spec.ts` | Student leadership decisions | Rankings, ratings, form submission |
| `teacher-dashboard.spec.ts` | Teacher dashboard | Game overview, company details, reports |
| `admin-compilation.spec.ts` | Admin compilation | Run compilation, view results, download reports |
| `navigation.spec.ts` | Navigation system | Menu, breadcrumbs, mobile nav, back button |

## Running Tests

### Basic Commands

```bash
# Run all Playwright E2E tests (auto-starts frontend Docker container)
npm run test:e2e:playwright

# Run with interactive UI mode
npm run test:e2e:playwright:ui

# Run in debug mode (with inspector)
npm run test:e2e:playwright:debug

# Run specific test file
npx playwright test auth.spec.ts

# Run specific test
npx playwright test --grep "magic link login"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
```

### Environment Variables

```bash
# Override base URL (default: http://localhost:5173)
BASE_URL=https://production-url.com npm run test:e2e:playwright

# Run in CI mode (no reuseExistingServer)
CI=true npm run test:e2e:playwright
```

### Parallel Execution

By default, tests run in parallel (one worker per CPU core). To control:

```bash
# Run with 2 workers
npx playwright test --workers=2

# Run serially (one at a time)
npx playwright test --workers=1
```

## Debugging

### HTML Reporter

After test run, view detailed HTML report:

```bash
npx playwright show-report
```

This opens an interactive report showing:
- Test results with screenshots
- Network requests
- Console logs
- Error details

### Traces

When tests fail, Playwright automatically captures traces. View them:

```bash
npx playwright show-trace trace.zip
```

### Debug Mode

```bash
# Run with Playwright Inspector
npm run test:e2e:playwright:debug

# Run specific test in debug mode
npx playwright test --debug auth.spec.ts
```

### VS Code Integration

Install the Playwright extension for VS Code:
- Right-click test file → "Run Test"
- Set breakpoints and use debugger
- View test results in sidebar

## Test Configuration

Configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/e2e/playwright',
  baseURL: 'http://localhost:5173',  // Override with BASE_URL env var
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: 'on-first-retry',         // Capture traces on retry
    screenshot: 'only-on-failure',    // Capture screenshots on failure
    video: 'retain-on-failure',       // Record videos on failure
  },
  webServer: {
    command: 'npm run docker:start:frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('does something', async ({ page }) => {
    // Navigate
    await page.goto('/some-page');

    // Interact
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```tsx
   <button data-testid="submit-button">Submit</button>
   ```
   ```ts
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for elements explicitly**:
   ```ts
   await page.waitForSelector('[data-testid="results"]');
   await expect(page.locator('text=Success')).isVisible({ timeout: 5000 });
   ```

3. **Use beforeEach for setup**:
   ```ts
   test.beforeEach(async ({ page }) => {
     await page.goto('/?role=student');
     await page.waitForTimeout(1000);
   });
   ```

4. **Handle dynamic content gracefully**:
   ```ts
   const element = page.locator('text=Candidate');
   const count = await element.count();
   if (count > 0) {
     await element.first().click();
   }
   ```

5. **Use page object pattern for complex workflows**:
   ```ts
   // tests/e2e/playwright/pages/LoginPage.ts
   export class LoginPage {
     constructor(private page: Page) {}

     async login(email: string) {
       await this.page.fill('input[name="email"]', email);
       await this.page.click('button[type="submit"]');
     }
   }

   // In test
   test('logs in', async ({ page }) => {
     const loginPage = new LoginPage(page);
     await loginPage.login('test@example.com');
   });
   ```

## Authentication Handling

For tests requiring authentication, we use query params for testing:

```typescript
test('authenticated workflow', async ({ page }) => {
  // Login as specific role using query param
  await page.goto('/?role=admin');
  await page.waitForTimeout(1000);

  // Now authenticated as admin
  await page.goto('/admin/compilation');
  await expect(page.locator('text=Admin')).toBeVisible();
});
```

**Note**: For production E2E testing, you'll need to:
1. Implement real authentication flow
2. Handle magic link extraction from emails
3. Store session state for test runs

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:playwright
        env:
          BASE_URL: https://staging.example.com

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Fail with "No element found"

**Issue**: Elements not found when expected

**Solutions**:
- Add explicit waits: `await page.waitForSelector selector)`
- Increase timeout: `await expect(locator).toBeVisible({ timeout: 10000 })`
- Check if selector is correct: Use `page.locator('selector').count()`
- Use Playwright codegen: `npx playwright codegen http://localhost:5173`

### Docker Container Won't Start

**Issue**: Frontend container fails to start

**Solutions**:
- Check Docker is running: `docker ps`
- Check port 5173 is free: `lsof -i :5173`
- Check Docker logs: `npm run docker:taillogs:frontend`
- Restart container: `npm run docker:restart:frontend`

### Tests Timeout

**Issue**: Tests timeout waiting for page load

**Solutions**:
- Increase timeout in config: `use: { navigationTimeout: 30000 }`
- Check backend is running: `curl http://localhost:3210/_health`
- Use production URL instead: `BASE_URL=https://prod-url.com npm run test:e2e:playwright`

### Flaky Tests

**Issue**: Tests pass sometimes, fail sometimes

**Solutions**:
- Add retries in config: `retries: 2`
- Use more robust selectors (data-testid over text)
- Add explicit waits for dynamic content
- Check for race conditions in navigation

## Advanced Usage

### API Testing

Playwright can also test API endpoints:

```typescript
test('API endpoint', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toHaveLength(10);
});
```

### Network Interception

Mock API calls for faster, isolated tests:

```typescript
test('with mocked API', async ({ page }) => {
  // Intercept API call
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([{ id: 1, name: 'Test' }]),
    });
  });

  await page.goto('/users');
  await expect(page.locator('text=Test')).toBeVisible();
});
```

### Multi-Tab Testing

Test interactions across multiple tabs:

```typescript
test('multi-tab workflow', async ({ context }) => {
  // Create two tabs
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await page1.goto('/?role=teacher');
  await page2.goto('/?role=student');

  // Test cross-tab behavior
  // ...
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright VS Code Extension](https://playwright.dev/docs/getting-started-vscode)
- [Playwright GitHub Actions](https://playwright.dev/docs/ci-intro)

## Migration from Vitest Browser Mode

| Aspect | Vitest Browser Mode | Playwright E2E |
|--------|---------------------|----------------|
| Scope | Component tests | Full E2E tests |
| Backend | Mocked Convex | Real Convex (local or prod) |
| Server | Vite dev server | Docker or production URL |
| Speed | Faster (isolated) | Slower (real browser) |
| Reliability | Less reliable (mocks) | More reliable (real) |
| Debugging | Browser DevTools | Playwright Inspector + traces |

**When to use which**:
- **Vitest Browser Mode**: Unit/integration tests, quick feedback, component testing
- **Playwright E2E**: Critical user workflows, regression testing, pre-deployment checks

## Next Steps

1. ✅ Playwright config created
2. ✅ 8 test spec files created
3. ✅ Scripts added to package.json
4. ✅ Documentation created
5. ⏭️ Run tests: `npm run test:e2e:playwright:install` then `npm run test:e2e:playwright`
6. ⏭️ Add tests as features are implemented
7. ⏭️ Set up CI/CD integration
8. ⏭️ Add authentication handling for production testing
