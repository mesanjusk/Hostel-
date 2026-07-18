import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Every deploy (Vercel, Render, or the EC2 pipeline) builds from a git checkout of main, and
// every commit on main is a merge/squash-merge of a PR — so its subject line always contains
// "(#123)" or "pull request #123". Reading that at build time gives every environment the same
// human-meaningful version with nothing to configure per-platform and nothing to bump by hand.
function readAppVersion(): string {
  try {
    const subject = execSync("git log -1 --format=%s", { cwd: __dirname }).toString().trim();
    const match = subject.match(/#(\d+)/);
    return match ? `PR #${match[1]}` : subject.slice(0, 40);
  } catch {
    return "dev";
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(readAppVersion()),
  },
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
