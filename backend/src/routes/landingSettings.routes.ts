import { createAsyncRouter } from "@/lib/asyncRouter";

import { getLandingPageSettings } from "@/services/landingPageSettingsService";

export const landingSettingsRouter = createAsyncRouter();

// Public — the /welcome pre-login screen fetches this for signed-out visitors, so this must not
// require auth. No caching: an admin's just-uploaded image should show up on next load, not be
// held back by a stale intermediary copy — same rationale as genderTheme.routes.ts.
landingSettingsRouter.get("/", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const settings = await getLandingPageSettings();
  res.json({ settings });
});
