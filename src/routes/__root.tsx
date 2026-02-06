/**
 * Root Layout Route
 *
 * This is the layout wrapper for ALL routes in the application.
 * It renders the <Outlet /> which displays child routes.
 *
 * Auth-based redirection logic is in /index.tsx (the root path route).
 *
 * Features:
 * - Error boundary for graceful error handling
 * - Suspense boundary for loading states
 * - Catches all uncaught errors from child routes
 */

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorPage } from "@/components/ErrorPage";

/**
 * Loading State Component
 *
 * Displays a spinner while routes are loading.
 */
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Loading Capo...
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we load the application
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
});

function RootLayout() {
  console.log('[__root.tsx] RootLayout rendering Outlet');
  return (
    <Suspense fallback={<LoadingState />}>
      <Outlet />
    </Suspense>
  );
}
