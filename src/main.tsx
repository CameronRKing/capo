import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { RouterProvider } from "@tanstack/react-router";
import "./index.css";
import { router } from "./router";

// Global error handlers to catch silent errors
window.addEventListener('error', (event) => {
  console.error('[Global Error Handler] Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Rejection Handler] Unhandled promise rejection:', event.reason);
});

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
console.log('[main.tsx] INIT - Convex URL:', convexUrl);

const convex = new ConvexReactClient(convexUrl);

console.log('[main.tsx] Convex client created');
console.log('[main.tsx] About to render to root element');

const rootElement = document.getElementById("root");
console.log('[main.tsx] Root element found:', rootElement);

createRoot(rootElement!).render(
  <StrictMode>
    {console.log('[main.tsx] StrictMode rendering')}
    <Suspense fallback={<div>Loading...</div>}>
      {console.log('[main.tsx] Suspense boundary active')}
      <ConvexProvider client={convex}>
        {console.log('[main.tsx] ConvexProvider rendered')}
        <RouterProvider
          router={router}
          context={{
            convex,
          }}
        />
      </ConvexProvider>
    </Suspense>
  </StrictMode>,
);
