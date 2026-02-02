import { createRouter, createRootRoute } from '@tanstack/react-router';
import { App } from './App';

// Create the root route with the App component
const rootRoute = createRootRoute({
  component: App,
});

// Create the router instance in code-routing mode
export const router = createRouter({
  routeTree: rootRoute,
  defaultPreload: 'intent',
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
