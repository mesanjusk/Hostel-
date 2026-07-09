import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { connectDB } from "@/db";
import { authRouter } from "@/routes/auth.routes";
import { profileRouter } from "@/routes/profile.routes";
import { categoriesRouter } from "@/routes/categories.routes";
import { checklistRouter } from "@/routes/checklist.routes";
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

const app = express();

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

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/non-browser requests (no Origin header) and any configured origin.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/checklist", checklistRouter);
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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
