/**
 * Root Route - Auth-based Redirection
 *
 * This is the entry point for the application. It checks authentication status
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
 *
 * @route /
 */

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";

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
 * Root Route Component
 *
 * Handles authentication-based redirection logic.
 */
function RootRouteComponent() {
  const user = useCurrentUser();

  // Loading state: User authentication is being checked
  if (user === undefined) {
    return <LoadingState />;
  }

  // Not authenticated: Redirect to login
  if (user === null) {
    return <Navigate to="/login" />;
  }

  // Authenticated: Redirect based on role
  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/compilation" />;
    case "teacher":
      return <Navigate to="/teacher/dashboard" />;
    case "student":
      return <Navigate to="/student/" />;
    default:
      // Fallback: If role is unrecognized, redirect to login
      // This shouldn't happen with proper RBAC, but safety first
      console.error("Unrecognized user role:", user.role);
      return <Navigate to="/login" />;
  }
}

/**
 * Route definition for the root path
 *
 * This route doesn't require any special loaders or beforeLoad hooks
 * since all auth checking happens client-side via the useCurrentUser hook.
 */
export const Route = createFileRoute("/")({
  component: RootRouteComponent,
});
