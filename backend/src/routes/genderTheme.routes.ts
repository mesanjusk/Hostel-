import { createAsyncRouter } from "@/lib/asyncRouter";

import { getAllGenderThemeSettings } from "@/services/genderThemeService";

export const genderThemeRouter = createAsyncRouter();

// Public — the boot-time theme fetch (useGenderTheme) runs for signed-out visitors too, so this
// must not require auth. No caching: an admin's edit should be visible on next load, not held
// back by a stale intermediary copy — same rationale as landing.routes.ts's /design endpoint.
genderThemeRouter.get("/", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const settings = await getAllGenderThemeSettings();
  res.json({ settings });
});
