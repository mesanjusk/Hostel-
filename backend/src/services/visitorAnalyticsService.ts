import { Types } from "mongoose";

import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { User } from "@/models/User";
import type { DateRange } from "@/lib/dateRange";
import { daysAgo, startOfDay, startOfMonth, startOfWeek } from "@/lib/dateRange";
import { getOnlineCount } from "@/services/eventService";
import { distinctValues } from "@/lib/distinctValues";

interface SessionSummary {
  _id: string;
  firstPage: string | null;
  lastPage: string | null;
  pageCount: number;
  start: Date;
  end: Date;
}

function topN<T extends { _id: string | null; count: number }>(rows: T[], n = 10) {
  return [...rows]
    .filter((r) => r._id)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map((r) => ({ value: r._id as string, count: r.count }));
}

/** Total/unique/new/returning visitors for a range. "New" = a visitor's first-ever event
 * (across all time, not just this range) falls inside the range; "returning" otherwise.
 * Requires a second query scoped to the visitors active in-range, since first-seen may
 * predate the range window. */
export async function getVisitorOverview(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const activeVisitorIds = await distinctValues<string>(AnalyticsEvent, "visitorId", match);
  if (activeVisitorIds.length === 0) {
    return { totalVisitors: 0, uniqueVisitors: 0, newVisitors: 0, returningVisitors: 0 };
  }

  const firstSeenRows = await AnalyticsEvent.aggregate<{ _id: string; firstSeen: Date }>([
    { $match: { visitorId: { $in: activeVisitorIds } } },
    { $group: { _id: "$visitorId", firstSeen: { $min: "$timestamp" } } },
  ]).allowDiskUse(true);

  let newVisitors = 0;
  let returningVisitors = 0;
  for (const row of firstSeenRows) {
    if (row.firstSeen >= range.start) newVisitors += 1;
    else returningVisitors += 1;
  }

  return {
    totalVisitors: activeVisitorIds.length,
    uniqueVisitors: activeVisitorIds.length,
    newVisitors,
    returningVisitors,
  };
}

/** Fixed-period activity snapshot (today/yesterday/this week/this month/online right now) —
 * independent of whatever custom range the dashboard is currently filtered to. */
export async function getActivitySnapshot() {
  await connectDB();
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = daysAgo(1, todayStart);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [today, yesterday, thisWeek, thisMonth] = await Promise.all([
    distinctValues(AnalyticsEvent, "visitorId", { timestamp: { $gte: todayStart } }),
    distinctValues(AnalyticsEvent, "visitorId", { timestamp: { $gte: yesterdayStart, $lt: todayStart } }),
    distinctValues(AnalyticsEvent, "visitorId", { timestamp: { $gte: weekStart } }),
    distinctValues(AnalyticsEvent, "visitorId", { timestamp: { $gte: monthStart } }),
  ]);

  return {
    activeToday: today.length,
    activeYesterday: yesterday.length,
    activeThisWeek: thisWeek.length,
    activeThisMonth: thisMonth.length,
    onlineNow: getOnlineCount(),
  };
}

/** Session-level metrics (count, duration, bounce rate, pages/session, entry/exit/landing
 * pages) derived by grouping page_view events by sessionId. Session summaries — one doc per
 * session — are pulled into Node for the final rollup since that's a far smaller set than
 * raw events and keeps the aggregation pipeline itself simple. */
export async function getSessionAnalytics(range: DateRange) {
  await connectDB();

  const sessions = await AnalyticsEvent.aggregate<SessionSummary>([
    { $match: { timestamp: { $gte: range.start, $lte: range.end }, eventName: "page_view" } },
    { $sort: { sessionId: 1, timestamp: 1 } },
    {
      $group: {
        _id: "$sessionId",
        firstPage: { $first: "$page" },
        lastPage: { $last: "$page" },
        pageCount: { $sum: 1 },
        start: { $min: "$timestamp" },
        end: { $max: "$timestamp" },
      },
    },
  ]).allowDiskUse(true);

  const sessionCount = sessions.length;
  if (sessionCount === 0) {
    return {
      sessionCount: 0,
      avgSessionDurationSeconds: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      entryPages: [],
      exitPages: [],
      landingPages: [],
    };
  }

  let totalDuration = 0;
  let totalPages = 0;
  let bounced = 0;
  const entryCounts = new Map<string, number>();
  const exitCounts = new Map<string, number>();

  for (const s of sessions) {
    totalDuration += (s.end.getTime() - s.start.getTime()) / 1000;
    totalPages += s.pageCount;
    if (s.pageCount <= 1) bounced += 1;
    if (s.firstPage) entryCounts.set(s.firstPage, (entryCounts.get(s.firstPage) ?? 0) + 1);
    if (s.lastPage) exitCounts.set(s.lastPage, (exitCounts.get(s.lastPage) ?? 0) + 1);
  }

  const toSorted = (m: Map<string, number>) =>
    [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  return {
    sessionCount,
    avgSessionDurationSeconds: Math.round(totalDuration / sessionCount),
    bounceRate: Math.round((bounced / sessionCount) * 1000) / 10,
    pagesPerSession: Math.round((totalPages / sessionCount) * 10) / 10,
    entryPages: toSorted(entryCounts),
    exitPages: toSorted(exitCounts),
    // "Landing page" = entry page, reported separately since it's the metric marketers
    // usually mean distinctly from "exit page" even though it's the same underlying stat.
    landingPages: toSorted(entryCounts),
  };
}

/** Per-page engagement: view counts (most/least visited), average scroll depth (from
 * scroll_checkpoint events, max percent reached per page view), and average time on page
 * (gap between consecutive page_view timestamps within the same session). */
export async function getPageEngagement(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const [viewCounts, scrollDepths, pageViews] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: { ...match, eventName: "page_view" } },
      { $group: { _id: "$page", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; avgPercent: number }>([
      { $match: { ...match, eventName: "scroll_checkpoint" } },
      { $group: { _id: "$page", avgPercent: { $avg: "$metadata.percent" } } },
    ]).allowDiskUse(true),
    // Time-on-page needs each session's ordered page sequence in Node (a pairwise consecutive-
    // timestamp diff, not a simple grouped sum) — capped the same way checklistAnalyticsService's
    // $sample-based cohort stat is, so a wide date range can't pull millions of raw rows into
    // one process's memory. Trades an exact answer over an unbounded scan for an exact answer
    // over a large bounded sample.
    AnalyticsEvent.find({ ...match, eventName: "page_view" })
      .select("sessionId page timestamp")
      .sort({ sessionId: 1, timestamp: 1 })
      .limit(50_000)
      .lean(),
  ]);

  const timeOnPage = new Map<string, { total: number; count: number }>();
  for (let i = 0; i < pageViews.length - 1; i++) {
    const current = pageViews[i];
    const next = pageViews[i + 1];
    if (current.sessionId !== next.sessionId || !current.page) continue;
    const seconds = (next.timestamp.getTime() - current.timestamp.getTime()) / 1000;
    if (seconds <= 0 || seconds > 30 * 60) continue; // ignore idle/overnight gaps
    const entry = timeOnPage.get(current.page) ?? { total: 0, count: 0 };
    entry.total += seconds;
    entry.count += 1;
    timeOnPage.set(current.page, entry);
  }

  const mostVisited = topN(viewCounts, 15);
  const leastVisited = [...viewCounts]
    .filter((r) => r._id)
    .sort((a, b) => a.count - b.count)
    .slice(0, 15)
    .map((r) => ({ value: r._id, count: r.count }));

  const avgScroll = scrollDepths
    .filter((r) => r._id)
    .map((r) => ({ page: r._id, avgScrollPercent: Math.round(r.avgPercent) }));

  const avgTimeOnPage = [...timeOnPage.entries()].map(([page, { total, count }]) => ({
    page,
    avgSeconds: Math.round(total / count),
  }));

  return { mostVisited, leastVisited, avgScroll, avgTimeOnPage };
}

/** Click/button/form interaction rollups. "Dead clicks" — clicks on non-interactive elements
 * that triggered no navigation or form action — rely on the client tagging `metadata.dead:
 * true` at capture time (see frontend lib/analytics/client.ts). */
export async function getInteractionAnalytics(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const [buttonClicks, deadClicks, formInteractions] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: { ...match, eventName: "button_click" } },
      { $group: { _id: "$metadata.label", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.countDocuments({ ...match, eventName: "click", "metadata.dead": true }),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: { ...match, eventName: "form_interaction" } },
      { $group: { _id: "$metadata.formId", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
  ]);

  return {
    mostClickedButtons: topN(buttonClicks, 15),
    deadClickCount: deadClicks,
    formInteractions: topN(formInteractions, 15),
  };
}

/** Device/browser/OS/screen/locale breakdown for the range. */
export async function getTechBreakdown(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const [devices, browsers, os, languages, timezones, resolutions] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$device.type", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$os", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$language", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$timezone", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      {
        $group: {
          _id: { $concat: [{ $toString: "$device.screenWidth" }, "x", { $toString: "$device.screenHeight" }] },
          count: { $sum: 1 },
        },
      },
    ]).allowDiskUse(true),
  ]);

  return {
    devices: topN(devices, 10),
    browsers: topN(browsers, 10),
    os: topN(os, 10),
    languages: topN(languages, 10),
    timezones: topN(timezones, 10),
    screenResolutions: topN(resolutions, 10),
  };
}

/** Country/state/city breakdown for the range. */
export async function getGeoBreakdown(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const [countries, states, cities] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$geo.country", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$geo.state", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$geo.city", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
  ]);

  return { countries: topN(countries, 15), states: topN(states, 15), cities: topN(cities, 15) };
}

/** Total time spent on the site per account, for the admin Users table (registered and
 * anonymous alike — an anonymous visitor's activity is tracked exactly the same way, since they
 * carry a real JWT and userId from their first page load; see auth-context.tsx). Scoped to a
 * specific batch of userIds (the current page of the table) rather than the whole collection —
 * this is rendered per-row, not as a dashboard aggregate.
 *
 * Same estimation the overview dashboard's avgSessionDurationSeconds uses: group events by
 * (userId, sessionId) and take the span between the first and last event in each session, then
 * sum across all of that user's sessions. Undercounts the very last page of their most recent
 * session slightly (no explicit "session end" event exists), which is an accepted trade-off
 * elsewhere in this file too rather than a gap specific to this function. */
export async function getTimeSpentByUserIds(
  userIds: string[],
): Promise<Map<string, { totalSeconds: number; sessionCount: number }>> {
  await connectDB();
  if (userIds.length === 0) return new Map();

  // Aggregation pipelines bypass Mongoose's usual query-time string-to-ObjectId casting, so
  // this needs to convert explicitly — a raw string $in here would silently match nothing.
  const objectIds = userIds.map((id) => new Types.ObjectId(id));

  const rows = await AnalyticsEvent.aggregate<{ _id: string; totalSeconds: number; sessionCount: number }>([
    { $match: { userId: { $in: objectIds } } },
    {
      $group: {
        _id: { userId: "$userId", sessionId: "$sessionId" },
        start: { $min: "$timestamp" },
        end: { $max: "$timestamp" },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        totalSeconds: { $sum: { $divide: [{ $subtract: ["$end", "$start"] }, 1000] } },
        sessionCount: { $sum: 1 },
      },
    },
  ]).allowDiskUse(true);

  const map = new Map<string, { totalSeconds: number; sessionCount: number }>();
  for (const row of rows) {
    map.set(row._id.toString(), { totalSeconds: Math.round(row.totalSeconds), sessionCount: row.sessionCount });
  }
  return map;
}

/** Splits traffic by *identity* rather than raw browser (visitorId): how many still-anonymous
 * visitors vs. mobile-linked (registered) users are new in this range vs. already existed
 * before it and came back. "New" is a direct count against User.createdAt (anonymous) or
 * User.registeredAt (registered — the moment a mobile got attached, which can be long after
 * that account's row was created). "Returning" needs the set of accounts that actually did
 * something in-range (via AnalyticsEvent.userId, populated for every request once a session
 * exists — see analyticsContext.ts) whose identity predates the range start. This is the
 * backing data for the admin dashboard's "new/returning × anonymous/registered" split, distinct
 * from getVisitorOverview's raw-browser new/returning numbers above. */
export async function getIdentityOverview(range: DateRange) {
  await connectDB();

  const [newAnonymousUsers, newRegisteredUsers, totalAnonymousUsers, totalRegisteredUsers] = await Promise.all([
    User.countDocuments({ mobile: { $exists: false }, createdAt: { $gte: range.start, $lte: range.end } }),
    User.countDocuments({ mobile: { $exists: true, $ne: null }, registeredAt: { $gte: range.start, $lte: range.end } }),
    User.countDocuments({ mobile: { $exists: false } }),
    User.countDocuments({ mobile: { $exists: true, $ne: null } }),
  ]);

  const activeUserIds = await distinctValues<string>(AnalyticsEvent, "userId", {
    timestamp: { $gte: range.start, $lte: range.end },
    userId: { $ne: null },
  });

  let returningAnonymousUsers = 0;
  let returningRegisteredUsers = 0;

  if (activeUserIds.length > 0) {
    const activeUsers = await User.find({ _id: { $in: activeUserIds } })
      .select("mobile createdAt registeredAt")
      .lean();

    for (const u of activeUsers) {
      const isRegistered = Boolean(u.mobile);
      const identifiedAt = isRegistered ? (u.registeredAt ?? u.createdAt) : u.createdAt;
      if (identifiedAt >= range.start) continue; // counted as "new" above, not "returning"
      if (isRegistered) returningRegisteredUsers += 1;
      else returningAnonymousUsers += 1;
    }
  }

  return {
    newAnonymousUsers,
    returningAnonymousUsers,
    newRegisteredUsers,
    returningRegisteredUsers,
    totalAnonymousUsers,
    totalRegisteredUsers,
  };
}

/** Referral source + UTM campaign performance, with conversion counted as a
 * registration_success by the same visitor within the range. */
export async function getReferralAnalytics(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const [sources, campaigns, conversions] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$referralSource", count: { $sum: 1 } } },
    ]).allowDiskUse(true),
    AnalyticsEvent.aggregate<{ _id: { campaign: string; source: string; medium: string }; visitors: string[] }>([
      { $match: { ...match, "utm.campaign": { $ne: null } } },
      {
        $group: {
          _id: { campaign: "$utm.campaign", source: "$utm.source", medium: "$utm.medium" },
          visitors: { $addToSet: "$visitorId" },
        },
      },
    ]).allowDiskUse(true),
    distinctValues(AnalyticsEvent, "visitorId", { ...match, eventName: "registration_success" }),
  ]);

  const convertedSet = new Set(conversions);
  const campaignPerformance = campaigns.map((c) => {
    const visitorCount = c.visitors.length;
    const converted = c.visitors.filter((v) => convertedSet.has(v)).length;
    return {
      campaign: c._id.campaign,
      source: c._id.source,
      medium: c._id.medium,
      visitors: visitorCount,
      conversions: converted,
      conversionRate: visitorCount === 0 ? 0 : Math.round((converted / visitorCount) * 1000) / 10,
    };
  });

  return {
    referralSources: topN(sources, 10),
    campaignPerformance: campaignPerformance.sort((a, b) => b.visitors - a.visitors).slice(0, 20),
  };
}
