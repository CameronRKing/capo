/**
 * QueryWithErrorBoundary Component
 *
 * Wrapper component for queries that provides automatic error handling
 * and loading states. Simplifies query error handling in components.
 *
 * Features:
 * - Automatic error handling for queries
 * - Loading state display
 * - Error state display with retry
 * - Renders children when data is available
 * - Optional custom loading/error states
 *
 * @example
 * ```tsx
 * <QueryWithErrorBoundary
 *   query={dashboardData}
 *   error="Failed to load dashboard"
 *   onRetry={() => refetch()}
 * >
 *   {(data) => <Dashboard data={data} />}
 * </QueryWithErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * <QueryWithErrorBoundary
 *   query={user}
 *   loading={<CustomLoading />}
 *   error="Failed to load user"
 * >
 *   {(user) => <UserProfile user={user} />}
 * </QueryWithErrorBoundary>
 * ```
 */

import React from "react";
import { ErrorState } from "./ErrorState";

export interface QueryWithErrorBoundaryProps<T> {
  /** Query result (from useQuery) */
  query: T | undefined | null;
  /** Optional error object from query */
  error?: unknown;
  /** Error message to display */
  error?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Custom loading state (optional) */
  loading?: React.ReactNode;
  /** Custom error state (optional) */
  errorComponent?: React.ReactNode;
  /** Children render function */
  children: (data: T) => React.ReactNode;
  /** Whether to show full-page loading (default: true) */
  fullPage?: boolean;
}

/**
 * QueryWithErrorBoundary - Wrapper for queries with automatic error handling
 *
 * @param query - Query result data
 * @param error - Error message or error object
 * @param onRetry - Retry handler
 * @param loading - Custom loading component
 * @param errorComponent - Custom error component
 * @param children - Render function with data
 * @param fullPage - Whether to show full-page loading/error (default: true)
 */
export function QueryWithErrorBoundary<T>({
  query,
  error: errorProp,
  onRetry,
  loading,
  errorComponent,
  children,
  fullPage = true,
}: QueryWithErrorBoundaryProps<T>) {
  // Loading state
  if (query === undefined) {
    return (
      loading || (
        <div
          className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${
            fullPage ? "" : "min-h-[200px]"
          }`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Error state
  if (query === null || errorProp) {
    return (
      errorComponent || (
        <ErrorState
          message={typeof errorProp === "string" ? errorProp : "Failed to load data"}
          error={typeof errorProp !== "string" ? errorProp : undefined}
          onRetry={onRetry}
          className={fullPage ? "" : "min-h-[200px]"}
        />
      )
    );
  }

  // Success - render children with data
  return <>{children(query)}</>;
}

/**
 * Hook to handle multiple queries with error boundaries
 * Useful when you have multiple independent queries
 *
 * @example
 * ```tsx
 * const queries = useQuerysWithErrorBoundary({
 *   dashboard: dashboardData,
 *   user: userData,
 * });
 *
 * if (queries.loading) return <LoadingState />;
 * if (queries.error) return <ErrorState message={queries.error} />;
 *
 * return <Dashboard dashboard={queries.data.dashboard} user={queries.data.user} />;
 * ```
 */
export interface QueryMap {
  [key: string]: unknown;
}

export interface QuerysWithErrorBoundaryResult<T extends QueryMap> {
  data: { [K in keyof T]: T[K] };
  loading: boolean;
  error: string | null;
}

export function useQuerysWithErrorBoundary<T extends QueryMap>(
  queries: T
): QuerysWithErrorBoundaryResult<T> {
  const entries = Object.entries(queries);

  const loading = entries.some(([, value]) => value === undefined);
  const errorEntry = entries.find(([, value]) => value === null);

  if (loading) {
    return { data: {} as any, loading: true, error: null };
  }

  if (errorEntry) {
    return {
      data: {} as any,
      loading: false,
      error: `Failed to load ${errorEntry[0]}`,
    };
  }

  return {
    data: queries as any,
    loading: false,
    error: null,
  };
}
