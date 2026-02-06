/**
 * RetryButton Component
 *
 * Reusable retry button component with loading state.
 * Used for retrying failed queries/mutations.
 *
 * Features:
 * - Loading state during retry
 * - Disabled while loading
 * - Consistent styling
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <RetryButton
 *   onRetry={() => refetch()}
 *   isLoading={isRefetching}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <RetryButton
 *   onRetry={handleRetry}
 *   isLoading={isPending}
 *   retryText="Retry Loading Data"
 * />
 * ```
 */

import React from "react";

export interface RetryButtonProps {
  /** Retry handler */
  onRetry: () => void;
  /** Whether retry is in progress */
  isLoading?: boolean;
  /** Optional button text */
  retryText?: string;
  /** Optional loading text */
  loadingText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "danger";
}

/**
 * RetryButton - Displays a retry button with loading state
 *
 * @param onRetry - Function to call on click
 * @param isLoading - Whether operation is in progress
 * @param retryText - Text for button (default: "Try Again")
 * @param loadingText - Text during loading (default: "Retrying...")
 * @param className - Additional CSS classes
 * @param variant - Button style variant (default: "primary")
 */
export function RetryButton({
  onRetry,
  isLoading = false,
  retryText = "Try Again",
  loadingText = "Retrying...",
  className = "",
  variant = "primary",
}: RetryButtonProps) {
  const variantClasses = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 focus:ring-offset-indigo-500",
    secondary:
      "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 focus:ring-offset-gray-500",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-red-500",
  };

  const baseClasses =
    "inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={onRetry}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {retryText}
        </>
      )}
    </button>
  );
}
