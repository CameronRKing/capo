/**
 * Stub for lightningcss native module in browser tests
 *
 * The real lightningcss module contains native code that can't be bundled
 * for the browser. This stub provides minimal functionality for E2E tests.
 */

export function transform(code: string, options?: any) {
  return {
    code,
    map: null,
    warnings: [],
  };
}

export const BrowserslistError = Error;

export default {
  transform,
  BrowserslistError,
};
