/**
 * Root Layout Route
 *
 * This is the layout wrapper for ALL routes in the application.
 * It renders the <Outlet /> which displays child routes.
 *
 * Auth-based redirection logic is in /index.tsx (the root path route).
 */

import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  console.log('[__root.tsx] RootLayout rendering Outlet');
  return <Outlet />;
}
