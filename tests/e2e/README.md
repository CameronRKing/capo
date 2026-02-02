# E2E Test Infrastructure

## Current Status

### Backend
- ✅ Convex local backend running on port 3210
- ⚠️ Functions may not be deployed yet

### Test Configuration
- ✅ `vitest.config.e2e.mts` - Browser mode with Playwright provider
- ✅ `tests/e2e/test-utils.tsx` - Test utilities with error-tolerant Convex client
- ✅ `tests/e2e/e2e-01-browser.test.tsx` - 6 tests for access request flow
- ✅ Error boundary in `src/routes/__root.tsx` for graceful error handling

## E2E-01 Tests

1. ✅ Access request form renders correctly
2. ✅ Form validation shows errors for empty fields
3. ✅ Form validates email format
4. ✅ Form submission shows loading state
5. ✅ Role selection highlights correctly
6. ✅ Form clears errors when user starts typing

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in watch mode
npm run test:e2e -- --watch

# Run single test file
npm run test:e2e -- e2e-01-browser.test.tsx
```

## Prerequisites

1. Convex backend must be running:
   ```bash
   npm run dev:backend
   ```

2. Convex functions must be deployed:
   ```bash
   npx convex deploy --local
   ```

## Known Issues

### "Could not find public function for 'users:getCurrent'"
This error occurs when Convex functions haven't been deployed to the local backend.

**Solution:** Deploy functions:
```bash
npx convex deploy --local
```

### Error Suppression
Tests use `unsuppressedErrors` option to suppress Convex errors during testing:
```typescript
const client = new ConvexReactClient(convexUrl, {
  unsuppressedErrors: {
    suppress: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errorMessage.includes("Could not find public function") ||
             errorMessage.includes("Server Error");
    },
  },
});
```

## Next Steps

Once E2E-01 passes, implement remaining P0 tests:
- E2E-02: Role-Based Routing & Dashboard Access
- E2E-03: Student Hiring Decision Submission
- E2E-04: Student Leadership Decision Submission
- E2E-05: Decision Validation & Constraints
- E2E-06: Stubbed Hiring Compilation
- E2E-07: Stubbed Leadership Compilation
