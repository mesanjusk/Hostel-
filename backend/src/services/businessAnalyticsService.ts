import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import type { DateRange } from "@/lib/dateRange";
import { startOfDay } from "@/lib/dateRange";
import { distinctValues } from "@/lib/distinctValues";

/** Top-level business/conversion dashboard. This app has no purchase/checkout flow, so
 * "login to purchase %" is mapped to "login to activation %" — activation defined as adding
 * at least one checklist item, the app's core first-value action — and reported under that
 * name rather than faking a purchase metric that doesn't exist in the product. */
export async function getBusinessAnalytics(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };
  const today = startOfDay(new Date());

  const [
    registeredUsers,
    anonymousUsers,
    newRegisteredUsersToday,
    newAnonymousUsersToday,
    totalVisitors,
    registeredVisitorIds,
    loginSuccessUserIds,
    legacyActivatedUserIds,
    v2ActivatedUserIds,
  ] = await Promise.all([
    // Admin-dashboard-only reads — prefer a secondary rather than compete with the
    // operational write path. "Registered" = has actually linked a mobile number, distinct
    // from an anonymous visitor's own User document (see userService.createAnonymousUser) —
    // a plain countDocuments() here would silently count anonymous accounts as "registered".
    User.countDocuments({ mobile: { $exists: true, $ne: null } }).read("secondaryPreferred"),
    User.countDocuments({ mobile: { $exists: false } }).read("secondaryPreferred"),
    User.countDocuments({ mobile: { $exists: true, $ne: null }, registeredAt: { $gte: today } }).read("secondaryPreferred"),
    User.countDocuments({ mobile: { $exists: false }, createdAt: { $gte: today } }).read("secondaryPreferred"),
    distinctValues(AnalyticsEvent, "visitorId", match),
    distinctValues(AnalyticsEvent, "visitorId", { ...match, eventName: "registration_success" }),
    distinctValues(AnalyticsEvent, "userId", { ...match, eventName: "login_success", userId: { $ne: null } }),
    distinctValues(
      ChecklistItem,
      "userId",
      { createdAt: { $gte: range.start, $lte: range.end } },
      "secondaryPreferred",
    ),
    // DB-driven (post-migration) users get their checklist auto-generated at onboarding —
    // same "added a checklist" activation signal as the legacy ChecklistItem row above.
    distinctValues(
      UserChecklist,
      "userId",
      { createdAt: { $gte: range.start, $lte: range.end } },
      "secondaryPreferred",
    ),
  ]);

  const activeUserIds = await distinctValues(AnalyticsEvent, "userId", { ...match, userId: { $ne: null } });
  const inactiveUsers = Math.max(0, registeredUsers - activeUserIds.length);

  const visitorToRegistrationRate =
    totalVisitors.length === 0 ? 0 : Math.round((registeredVisitorIds.length / totalVisitors.length) * 1000) / 10;

  const registrationToLoginRate =
    registeredVisitorIds.length === 0 ? 0 : Math.round((loginSuccessUserIds.length / registeredVisitorIds.length) * 1000) / 10;

  const activatedSet = new Set([...legacyActivatedUserIds, ...v2ActivatedUserIds].map(String));
  const loginToActivationRate =
    loginSuccessUserIds.length === 0
      ? 0
      : Math.round(
          (loginSuccessUserIds.filter((id) => activatedSet.has(String(id))).length / loginSuccessUserIds.length) * 1000,
        ) / 10;

  const loginCountByUser = await AnalyticsEvent.aggregate<{ _id: string; days: string[] }>([
    { $match: { ...match, eventName: "login_success", userId: { $ne: null } } },
    {
      $group: {
        _id: "$userId",
        days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } } },
      },
    },
  ]).allowDiskUse(true);
  const repeatUsers = loginCountByUser.filter((row) => row.days.length > 1).length;
  const repeatUsersRate = loginCountByUser.length === 0 ? 0 : Math.round((repeatUsers / loginCountByUser.length) * 1000) / 10;

  return {
    registeredUsers,
    anonymousUsers,
    newRegisteredUsersToday,
    newAnonymousUsersToday,
    activeUsers: activeUserIds.length,
    inactiveUsers,
    conversionRates: {
      visitorToRegistration: visitorToRegistrationRate,
      registrationToLogin: registrationToLoginRate,
      loginToActivation: loginToActivationRate,
    },
    repeatUsersRate,
  };
}
