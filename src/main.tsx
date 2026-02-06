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
const convex = new ConvexReactClient(convexUrl);
const rootElement = document.getElementById("root");

createRoot(rootElement!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <ConvexProvider client={convex}>
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
