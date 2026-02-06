/**
 * ErrorState Component
 *
 * Inline error display component for showing errors within pages.
 * Designed to match LoadingState and AccessDenied components.
 *
 * Features:
 * - User-friendly error message
 * - Optional error details (for debugging)
 * - Retry button support
 * - Dark mode support
 * - Consistent styling with LoadingState
 *
 * @example
 * ```tsx
 * if (queryError) {
 *   return <ErrorState message="Failed to load data" error={queryError} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * <ErrorState
 *   message="Failed to load dashboard"
 *   error={error}
 *   onRetry={() => refetch()}
 * />
 * ```
 */

import React from "react";

export interface ErrorStateProps {
  /** User-friendly error message to display */
  message: string;
  /** The actual error object (for debugging/details) */
  error?: unknown;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Optional retry button text */
  retryText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ErrorState - Displays an inline error message with optional retry button
 *
 * @param message - User-friendly error message
 * @param error - The error object (optional, for debugging)
 * @param onRetry - Retry handler (optional)
 * @param retryText - Text for retry button (default: "Try Again")
 * @param className - Additional CSS classes (optional)
 */
export function ErrorState({
  message,
  error,
  onRetry,
  retryText = "Try Again",
  className = "",
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : null;

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${className}`}
    >
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2 text-center">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-red-700 dark:text-red-400 mb-4 text-center">{message}</p>

        {/* Error Details (if error object provided) */}
        {error && import.meta.env.DEV && (
          <details className="mb-4">
            <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-300">
              Error details
            </summary>
            <div className="mt-2 text-xs bg-red-100 dark:bg-red-900/40 p-3 rounded overflow-auto max-h-40">
              <p className="font-mono text-red-800 dark:text-red-300 mb-2">{errorMessage}</p>
              {errorStack && (
                <pre className="font-mono text-red-700 dark:text-red-400 whitespace-pre-wrap">
                  {errorStack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Retry Button */}
        {onRetry && (
          <div className="flex justify-center">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {retryText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
