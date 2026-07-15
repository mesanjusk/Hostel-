import "dotenv/config";
import { createServer } from "node:http";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import { connectDB } from "@/db";
import { ensureCitiesSeeded } from "@/services/cityService";
import { ensureGlobalCommunitiesSeeded } from "@/services/communityService";
import { initSocketServer } from "@/lib/socket";
import { analyticsContext } from "@/middleware/analyticsContext";
import { authRouter } from "@/routes/auth.routes";
import { profileRouter } from "@/routes/profile.routes";
import { categoriesRouter } from "@/routes/categories.routes";
import { checklistRouter } from "@/routes/checklist.routes";
import { bagRouter } from "@/routes/bag.routes";
import { budgetRouter } from "@/routes/budget.routes";
import { notesRouter } from "@/routes/notes.routes";
import { documentsRouter } from "@/routes/documents.routes";
import { contactsRouter } from "@/routes/contacts.routes";
import { wishlistRouter } from "@/routes/wishlist.routes";
import { productsRouter } from "@/routes/products.routes";
import { guideRouter } from "@/routes/guide.routes";
import { dashboardRouter } from "@/routes/dashboard.routes";
import { searchRouter } from "@/routes/search.routes";
import { adminRouter } from "@/routes/admin.routes";
import { landingRouter } from "@/routes/landing.routes";
import { navRouter } from "@/routes/nav.routes";
import { homeRouter } from "@/routes/home.routes";
import { uploadRouter } from "@/routes/upload.routes";
import { whatsappRouter } from "@/routes/whatsapp.routes";
import { waRegisterRouter } from "@/routes/waRegister.routes";
import { analyticsRouter } from "@/routes/analytics.routes";
import { discoveryRouter } from "@/routes/discovery.routes";
import { directoryContactsRouter } from "@/routes/directoryContacts.routes";
import { bookingsRouter } from "@/routes/bookings.routes";
import { placesRouter } from "@/routes/places.routes";
import { citiesRouter } from "@/routes/cities.routes";
import { collegeCategoriesRouter } from "@/routes/collegeCategories.routes";
import { coursesRouter } from "@/routes/courses.routes";
import { communitiesRouter } from "@/routes/communities.routes";
import { chatRouter } from "@/routes/chat.routes";
import { conversationsRouter } from "@/routes/conversations.routes";
import { moderationRouter } from "@/routes/moderation.routes";
import { usersRouter } from "@/routes/users.routes";

const app = express();

// Render puts one reverse proxy in front of this service, so req.ip (and express-rate-limit's
// IP-keyed limiter below) need `trust proxy` to read the real client IP from X-Forwarded-For
// instead of the proxy's own address — without it every student behind Render's LB would
// share one rate-limit bucket. Matches lib/geo.ts, which already reads XFF manually for the
// same reason.
app.set("trust proxy", 1);

// Every response here is JSON going to a mobile-heavy student audience — gzip cuts payload
// size dramatically (checklist/dashboard/search responses especially) for negligible CPU cost.
app.use(compression());

// JSON API only — disable the HTML-oriented CSP directives and keep resources fetchable
// cross-origin (the frontend runs on a separate origin and relies on the `cors` config below).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Vercel deploys a brand-new preview URL for every branch/PR push (hostel-jsk8-git-<branch>-
// <team>.vercel.app, plus a random-hash variant per deployment) — there's no way to keep a
// static CORS_ORIGIN env var in sync with those, so any preview of this specific Vercel project
// is allowed in addition to the explicit allowlist. Without this, every API call from a preview
// deploy (registration, onboarding, checklist, everything) fails with a CORS error.
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/hostel-jsk8(-[a-z0-9-]+)?\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/non-browser requests (no Origin header) and any configured origin.
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        VERCEL_PREVIEW_ORIGIN.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);
// Raised from Express's 100kb default: the admin home-screen editor saves uploaded
// stickers inline as base64 data URIs, which can be a few MB per save.
// `verify` stashes the raw request bytes on `req.rawBody` — needed by the Metabsp
// webhook to check its HMAC signature against the exact bytes that were signed,
// since re-serializing the parsed JSON is not guaranteed to be byte-identical.
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Coarse abuse guard across every API route — the chat/report/community endpoints layer
// their own tighter limits (see lib/rateLimiter.ts) on top of this general ceiling.
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(analyticsContext);

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/checklist", checklistRouter);
app.use("/api/bags", bagRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/notes", notesRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/products", productsRouter);
app.use("/api/guide", guideRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/search", searchRouter);
app.use("/api/admin", adminRouter);
app.use("/api/landing", landingRouter);
app.use("/api/nav", navRouter);
app.use("/api/home", homeRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/wa-register", waRegisterRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/discovery", discoveryRouter);
app.use("/api/directory-contacts", directoryContactsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/places", placesRouter);
app.use("/api/cities", citiesRouter);
app.use("/api/college-categories", collegeCategoriesRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/communities", communitiesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/moderation", moderationRouter);
app.use("/api/users", usersRouter);

// Unmatched routes: respond JSON, not Express's default HTML 404 page — this is a JSON-only API.
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 4000;

// A plain http.Server wraps the Express app so Socket.IO (real-time chat/presence) can share
// the same port and TLS termination as the REST API — Render only exposes one port per service.
const httpServer = createServer(app);
initSocketServer(httpServer);

connectDB()
  .then(() => Promise.all([ensureCitiesSeeded(), ensureGlobalCommunitiesSeeded()]))
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });

// On redeploy/restart Render sends SIGTERM — without handling it, in-flight requests, open
// Socket.IO connections, and the Mongo connection are all cut abruptly instead of drained.
function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  httpServer.close(async () => {
    try {
      await mongoose.connection.close();
    } finally {
      clearTimeout(forceExit);
      process.exit(0);
    }
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
