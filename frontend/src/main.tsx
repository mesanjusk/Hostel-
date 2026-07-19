import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { AppErrorBoundary } from "@/components/shared/error-boundary";
import App from "@/App";

// Self-hosted (not Google Fonts CDN) so these are same-origin requests: the service worker's
// default cache-first strategy (sw.js) picks them up automatically on first fetch, same as any
// other static asset. That's what actually fixes the "wrong font flashes before settling"
// symptom on iOS home-screen launches — a cross-origin font fetch is never cached by the SW at
// all (see the origin check in sw.js), so on an iOS PWA relaunch it depended on Safari's own
// HTTP cache, which iOS evicts aggressively for installed PWAs. Once these are same-origin and
// SW-cached, a repeat launch renders the fonts from Cache Storage instead of racing a network
// fetch — see index.html, which no longer needs the old print-media Google Fonts trick.
// Imported here (not index.css) because Tailwind's Vite plugin fails to rebase these packages'
// relative font-file url()s when they're pulled in via a CSS @import instead.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "@fontsource/alex-brush/400.css";

import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-center" />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}
