import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Pin the React runtime + router (stable, on nearly every route) into their own
        // chunk. It rarely changes, so a normal app-code deploy no longer busts its cache —
        // returning visitors keep the biggest shared dependency from disk instead of
        // re-downloading it inside a fresh entry chunk each release.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Without this, Rollup emits every icon shared between two or more lazy routes as
          // its own micro-chunk (~50 requests of <1KB each on first load). One shared chunk
          // of just the icons the app actually imports costs a single request instead, and
          // like react-vendor it rarely changes between deploys, so it stays cached.
          "lucide-icons": ["lucide-react"],
        },
      },
    },
  },
});
