import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import type { DateRange } from "@/lib/dateRange";
import { startOfDay } from "@/lib/dateRange";

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
    newUsersToday,
    totalVisitors,
    registeredVisitorIds,
    loginSuccessUserIds,
    legacyActivatedUserIds,
    v2ActivatedUserIds,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: today } }),
    AnalyticsEvent.distinct("visitorId", match),
    AnalyticsEvent.distinct("visitorId", { ...match, eventName: "registration_success" }),
    AnalyticsEvent.distinct("userId", { ...match, eventName: "login_success", userId: { $ne: null } }),
    ChecklistItem.distinct("userId", { createdAt: { $gte: range.start, $lte: range.end } }),
    // DB-driven (post-migration) users get their checklist auto-generated at onboarding —
    // same "added a checklist" activation signal as the legacy ChecklistItem row above.
    UserChecklist.distinct("userId", { createdAt: { $gte: range.start, $lte: range.end } }),
  ]);

  const activeUserIds = await AnalyticsEvent.distinct("userId", { ...match, userId: { $ne: null } });
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
  ]);
  const repeatUsers = loginCountByUser.filter((row) => row.days.length > 1).length;
  const repeatUsersRate = loginCountByUser.length === 0 ? 0 : Math.round((repeatUsers / loginCountByUser.length) * 1000) / 10;

  return {
    registeredUsers,
    newUsersToday,
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
