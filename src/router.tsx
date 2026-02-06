// Router Configuration
//
// This file configures TanStack Router with file-based routing.
//
// The TanStack Router Vite plugin automatically generates the route tree
// from the files in /src/routes/ directory during development and build time.
//
// Generated route tree: /src/routeTree.gen.ts
//
// Root route: /src/routes/__root.tsx
// Other routes: /src/routes/**/*.tsx

import { createRouter } from '@tanstack/react-router';
import { ConvexReactClient } from 'convex/react';
import { routeTree } from './routeTree.gen';

// Create the router instance using the generated route tree
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    // This will be set by the RouterProvider wrapper
    convex: undefined as unknown as ConvexReactClient,
  },
});

// Log router state changes
router.subscribe('onResolved', (event) => {
  console.log('[router] Route resolved:', {
    path: event.toLocation.href,
    pathname: event.toLocation.pathname,
    params: event.toLocation.params,
    search: event.toLocation.search,
  });
});

router.subscribe('onError', (event) => {
  console.error('[router] Router error:', event);
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface RouteContext {
    convex: ConvexReactClient;
  }
}
