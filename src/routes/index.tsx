/**
 * Index Route - Root Path (/)
 *
 * This is the actual "/" route. It checks authentication status
 * and redirects users to the appropriate dashboard based on their role:
 *
 * - Not authenticated → Redirect to /login
 * - Admin → Redirect to /admin/compilation
 * - Teacher → Redirect to /teacher/dashboard
 * - Student → Redirect to /student/
 *
 * Features:
 * - Shows loading state while checking authentication
 * - Handles unauthenticated users gracefully
 * - Prevents flashing of incorrect content
 * - Uses TanStack Router's Navigate component for redirects
 * - Includes error boundary for graceful error handling
 *
 * @route /
 */

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Loading State Component
 *
 * Displays a spinner while checking authentication status.
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
          Please wait while we verify your account
        </p>
      </div>
    </div>
  );
}

/**
 * Error Boundary Component
 *
 * Catches and displays errors gracefully, especially useful during E2E tests
 * when Convex functions may not be deployed yet.
 */
function IndexErrorBoundary({ error }: { error: unknown }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          For E2E tests, this is expected if Convex functions aren't deployed yet.
        </p>
      </div>
    </div>
  );
}

/**
 * Index Route Component
 *
 * Handles authentication-based redirection logic for the root path.
 */
function IndexRouteComponent() {
  const user = useCurrentUser();

  console.log('[index.tsx] IndexRouteComponent called');
  console.log('[index.tsx] useCurrentUser returned:', user);

  // Loading state: User authentication is being checked
  if (user === undefined) {
    console.log('[index.tsx] Branch: user === undefined (loading)');
    return <LoadingState />;
  }

  // Not authenticated: Redirect to login
  if (user === null) {
    console.log('[index.tsx] Branch: user === null (redirect to login)');
    return <Navigate to="/login" />;
  }

  // Authenticated: Redirect based on role
  console.log('[index.tsx] Branch: authenticated user, role:', user.role);
  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/compilation" />;
    case "teacher":
      return <Navigate to="/teacher/dashboard" />;
    case "student":
      return <Navigate to="/student" />;
    default:
      // Fallback: If role is unrecognized, redirect to login
      // This shouldn't happen with proper RBAC, but safety first
      console.error("[index.tsx] Unrecognized user role:", user.role);
      return <Navigate to="/login" />;
  }
}

/**
 * Route definition for the root index path
 *
 * This route handles the "/" URL specifically.
 * Includes errorComponent for graceful error handling.
 */
export const Route = createFileRoute("/")({
  component: IndexRouteComponent,
  errorComponent: IndexErrorBoundary,
});
