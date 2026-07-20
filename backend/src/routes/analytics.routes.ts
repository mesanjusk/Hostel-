import type { Request } from "express";
import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAdmin, requireAuth, optionalAuth } from "@/middleware/auth";
import { logEventAsync } from "@/services/eventService";
import {
  getVisitorOverview,
  getActivitySnapshot,
  getSessionAnalytics,
  getPageEngagement,
  getInteractionAnalytics,
  getTechBreakdown,
  getGeoBreakdown,
  getReferralAnalytics,
  getIdentityOverview,
} from "@/services/visitorAnalyticsService";
import { getRegistrationFunnel } from "@/services/registrationFunnelService";
import { getLoginAnalytics } from "@/services/loginAnalyticsService";
import { getPageLoadStats, getNavigationFlow } from "@/services/behaviorAnalyticsService";
import { getRetentionAnalytics } from "@/services/retentionService";
import { getBusinessAnalytics } from "@/services/businessAnalyticsService";
import { getRealtimeSnapshot } from "@/services/realtimeAnalyticsService";
import { collectEventsSchema, dateRangeQuerySchema } from "@/validations/analytics";
import { resolveDateRange } from "@/lib/dateRange";

export const analyticsRouter = createAsyncRouter();

// --- Ingestion -------------------------------------------------------------------------
// Public: anonymous visitors (pre-login, pre-registration) must be trackable too. userId is
// never taken from the request body — only from a validated bearer token, if present.
analyticsRouter.post("/collect", optionalAuth, (req, res) => {
  const parsed = collectEventsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const ip = req.analytics?.ip ?? null;
  const userAgent = req.analytics?.userAgent ?? null;
  const userId = req.user?._id.toString() ?? null;

  for (const event of parsed.data.events) {
    logEventAsync({
      eventName: event.eventName,
      userId,
      visitorId: event.visitorId,
      sessionId: event.sessionId,
      page: event.page ?? null,
      referrer: event.referrer ?? null,
      utm: event.utm ?? null,
      device: event.device ?? null,
      language: event.language ?? null,
      timezone: event.timezone ?? null,
      ip,
      userAgent,
      metadata: event.metadata ?? null,
      timestamp: event.timestamp ? new Date(event.timestamp) : undefined,
    });
  }

  // 202: accepted for async processing — the caller doesn't need to wait on storage.
  res.status(202).json({ accepted: parsed.data.events.length });
});

// --- Dashboard reads (admin only) -------------------------------------------------------
analyticsRouter.use(requireAuth, requireAdmin);

function parseRange(req: Request) {
  const parsed = dateRangeQuerySchema.safeParse(req.query);
  return resolveDateRange(parsed.success ? parsed.data.from : undefined, parsed.success ? parsed.data.to : undefined);
}

analyticsRouter.get("/overview", async (req, res) => {
  const range = parseRange(req);
  const [visitors, activity, sessions] = await Promise.all([
    getVisitorOverview(range),
    getActivitySnapshot(),
    getSessionAnalytics(range),
  ]);
  res.json({ range, visitors, activity, sessions });
});

analyticsRouter.get("/engagement", async (req, res) => {
  const range = parseRange(req);
  const [pages, interactions] = await Promise.all([getPageEngagement(range), getInteractionAnalytics(range)]);
  res.json({ range, pages, interactions });
});

analyticsRouter.get("/tech", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, tech: await getTechBreakdown(range) });
});

analyticsRouter.get("/geo", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, geo: await getGeoBreakdown(range) });
});

analyticsRouter.get("/referral", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, referral: await getReferralAnalytics(range) });
});

analyticsRouter.get("/identity", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, identity: await getIdentityOverview(range) });
});

analyticsRouter.get("/registration-funnel", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, funnel: await getRegistrationFunnel(range) });
});

analyticsRouter.get("/login", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, login: await getLoginAnalytics(range) });
});

analyticsRouter.get("/behavior", async (req, res) => {
  const range = parseRange(req);
  const [pageLoad, navigation] = await Promise.all([getPageLoadStats(range), getNavigationFlow(range)]);
  res.json({ range, pageLoad, navigation });
});

analyticsRouter.get("/retention", async (_req, res) => {
  res.json({ retention: await getRetentionAnalytics() });
});

analyticsRouter.get("/business", async (req, res) => {
  const range = parseRange(req);
  res.json({ range, business: await getBusinessAnalytics(range) });
});

analyticsRouter.get("/realtime", async (_req, res) => {
  res.json({ realtime: await getRealtimeSnapshot() });
});
