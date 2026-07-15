import { connectDB } from "@/db";
import { AnalyticsEvent, type AnalyticsEventName } from "@/models/AnalyticsEvent";
import { resolveReferralSource } from "@/lib/referrer";
import { lookupGeo, hashIp } from "@/lib/geo";
import { parseUserAgent, type DeviceType } from "@/lib/userAgent";

export interface LogEventInput {
  eventName: AnalyticsEventName;
  userId?: string | null;
  visitorId: string;
  sessionId: string;
  page?: string | null;
  referrer?: string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  } | null;
  device?: { type?: DeviceType; screenWidth?: number | null; screenHeight?: number | null } | null;
  language?: string | null;
  timezone?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp?: Date;
}

interface OnlineVisitor {
  lastSeen: number;
  page: string | null;
  country: string | null;
  deviceType: string | null;
  browser: string | null;
  userId: string | null;
}

/** In-memory "who's online" state for the real-time dashboard. Deliberately not persisted —
 * same tradeoff already made for WhatsApp session state in this codebase (see
 * whatsapp.routes.ts): a single Node process, no new collection, lost on restart is fine for
 * presence data. Revisit with Redis/pub-sub if this ever runs on more than one instance. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const onlineVisitors = new Map<string, OnlineVisitor>();

function pruneOnline(): void {
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  for (const [visitorId, entry] of onlineVisitors) {
    if (entry.lastSeen < cutoff) onlineVisitors.delete(visitorId);
  }
}

// Self-prune on a timer instead of relying solely on getOnlineVisitors()/getOnlineCount() being
// called — otherwise this map only shrinks when an admin happens to view the live dashboard,
// growing unbounded (one entry per distinct visitor) for as long as nobody looks at it.
setInterval(pruneOnline, 60 * 1000).unref();

export function getOnlineVisitors(): (OnlineVisitor & { visitorId: string })[] {
  pruneOnline();
  return [...onlineVisitors.entries()].map(([visitorId, entry]) => ({ visitorId, ...entry }));
}

export function getOnlineCount(): number {
  pruneOnline();
  return onlineVisitors.size;
}

/** Records one analytics event: enriches with server-derived geo/UA/referral fields the
 * client can't (or shouldn't) be trusted to supply, then writes it to the single
 * AnalyticsEvent collection and updates the in-memory presence map. Fire-and-forget from
 * callers — never let analytics writes block or fail the request they're attached to. */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await connectDB();

    const geo = input.ip ? lookupGeo(input.ip) : { country: null, state: null, city: null };
    const ipHash = input.ip ? hashIp(input.ip) : null;
    const uaParsed = parseUserAgent(input.userAgent ?? undefined);
    const deviceType = input.device?.type ?? uaParsed.deviceType;
    const referralSource = resolveReferralSource(input.referrer ?? null, input.utm?.source ?? null);
    const timestamp = input.timestamp ?? new Date();

    await AnalyticsEvent.create({
      eventName: input.eventName,
      userId: input.userId || null,
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      page: input.page ?? null,
      referrer: input.referrer ?? null,
      referralSource,
      utm: {
        source: input.utm?.source ?? null,
        medium: input.utm?.medium ?? null,
        campaign: input.utm?.campaign ?? null,
        term: input.utm?.term ?? null,
        content: input.utm?.content ?? null,
      },
      device: {
        type: deviceType,
        screenWidth: input.device?.screenWidth ?? null,
        screenHeight: input.device?.screenHeight ?? null,
      },
      browser: uaParsed.browser,
      os: uaParsed.os,
      language: input.language ?? null,
      timezone: input.timezone ?? null,
      geo,
      ipHash,
      metadata: input.metadata ?? null,
      timestamp,
    });

    onlineVisitors.set(input.visitorId, {
      lastSeen: timestamp.getTime(),
      page: input.page ?? null,
      country: geo.country,
      deviceType,
      browser: uaParsed.browser,
      userId: input.userId || null,
    });
  } catch (error) {
    console.error("[analytics] Failed to log event:", error);
  }
}

/** Same as `logEvent` but never throws and never awaits the caller — for call sites (e.g.
 * inside auth routes) that must not have their response latency or success depend on
 * analytics storage. */
export function logEventAsync(input: LogEventInput): void {
  void logEvent(input);
}
