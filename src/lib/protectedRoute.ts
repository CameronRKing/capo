/**
 * Protected Route Utilities
 *
 * Helper functions for implementing protected routes with role-based access control.
 * Integrates with TanStack Router's beforeLoad hook to enforce authentication and authorization.
 *
 * Usage:
 * ```tsx
 * export const Route = createFileRoute("/admin/dashboard")({
 *   beforeLoad: protectedRoute("admin"),
 *   component: AdminDashboard,
 * });
 * ```
 */

import { redirect } from "@tanstack/react-router";
import type { Context } from "@tanstack/react-router";

/**
 * User roles in the system
 */
export type UserRole = "admin" | "teacher" | "student";

/**
 * Authenticated user with role and assignments
 */
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  gameId?: string;
  companyId?: string;
}

/**
 * Protected route guard
 *
 * Ensures the user is authenticated and has the required role.
 * Redirects to /login if not authenticated.
 * Redirects to / if unauthorized (wrong role).
 *
 * @param requiredRole - Optional specific role required (e.g., "admin")
 * @param allowedRoles - Optional array of allowed roles (e.g., ["admin", "teacher"])
 *
 * @example
 * // Admin-only route
 * beforeLoad: () => protectedRoute("admin")
 *
 * @example
 * // Admin or teacher route
 * beforeLoad: () => protectedRoute(null, ["admin", "teacher"])
 *
 * @example
 * // Any authenticated user
 * beforeLoad: () => protectedRoute()
 */
export function protectedRoute(
  requiredRole?: UserRole | null,
  allowedRoles?: UserRole[]
) {
  return async ({ context }: { context: Context }) => {
    // Get the Convex client from context
    const convex = (context as any).convex;

    if (!convex) {
      throw redirect({
        to: "/login",
        search: {
          redirect: window.location.pathname,
        },
      });
    }

    try {
      // Import dynamically to avoid issues
      const { api } = await import("../../convex/_generated/api");

      // Query the current user from Convex
      const user: AuthUser | null = await convex.query(
        api.users.getCurrent
      );

      if (!user) {
        // Not authenticated - redirect to login
        throw redirect({
          to: "/login",
          search: {
            redirect: window.location.pathname,
          },
        });
      }

      // Check role-based authorization
      if (requiredRole || allowedRoles) {
        const roles = allowedRoles || (requiredRole ? [requiredRole] : []);

        // Admins can access everything
        if (user.role === "admin") {
          return { user };
        }

        // Check if user's role is in the allowed roles
        if (!roles.includes(user.role)) {
          // Unauthorized - redirect to home with error
          throw redirect({
            to: "/",
            search: {
              error: "unauthorized",
            },
          });
        }
      }

      return { user };
    } catch (error: any) {
      // If it's a redirect, re-throw it
      if (error instanceof redirect) {
        throw error;
      }

      // Other errors - redirect to login
      console.error("Protected route error:", error);
      throw redirect({
        to: "/login",
        search: {
          redirect: window.location.pathname,
          error: "auth_error",
        },
      });
    }
  };
}

/**
 * Convenience wrapper for admin-only routes
 */
export function adminRoute() {
  return protectedRoute("admin");
}

/**
 * Convenience wrapper for teacher routes (admin + teacher)
 */
export function teacherRoute() {
  return protectedRoute(null, ["admin", "teacher"]);
}

/**
 * Convenience wrapper for student routes (admin + student)
 */
export function studentRoute() {
  return protectedRoute(null, ["admin", "student"]);
}

/**
 * Hook to use the authenticated user from route context
 *
 * @example
 * function MyComponent() {
 *   const { user } = Route.useRouteContext();
 *   return <div>Welcome, {user.name}</div>;
 * }
 */
export function useAuthenticatedUser(): AuthUser {
  // This would be used after the protectedRoute has run
  // The user is available in the route context
  throw new Error(
    "useAuthenticatedUser must be used within a route protected by protectedRoute()"
  );
}

/**
 * Server-side helper to get current user from Convex context
 *
 * This is used on the backend (in Convex functions) via the permissions module.
 * This file is for frontend route protection.
 */
export async function getCurrentUserForRoute(
  convex: any
): Promise<AuthUser | null> {
  try {
    const { api } = await import("../../convex/_generated/api");
    return await convex.query(api.users.getCurrent);
  } catch {
    return null;
  }
}
