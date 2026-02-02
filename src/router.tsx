import { createRouter, createRootRoute, createRouteContext } from '@tanstack/react-router';
import { ConvexReactClient } from 'convex/react';
import { App } from './App';

// Create route context to pass Convex client to all routes
export const RouteContext = createRouteContext({
  convex: undefined as unknown as ConvexReactClient,
});

// Create the root route with the App component
const rootRoute = createRootRoute({
  component: App,
}).createChildRoute(RouteContext.Provider);

// Create the router instance in code-routing mode
export const router = createRouter({
  routeTree: rootRoute,
  defaultPreload: 'intent',
  context: {
    // This will be set by the RouterProvider wrapper
    convex: undefined as unknown as ConvexReactClient,
  },
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
