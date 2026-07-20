import { connectDB } from "@/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { User } from "@/models/User";
import type { DateRange } from "@/lib/dateRange";
import { daysAgo, startOfMonth, startOfWeek } from "@/lib/dateRange";
import { distinctValues } from "@/lib/distinctValues";

export async function getLoginAnalytics(range: DateRange) {
  await connectDB();
  const match = { timestamp: { $gte: range.start, $lte: range.end } };

  const [
    loginSuccess,
    loginFailed,
    forgotPasswordRequests,
    otpLoginSuccess, // "OTP login" = the forgot-code/reset-via-OTP flow, since this app has no
    // password-less-OTP-only login path distinct from the mobile+code login — a reset always
    // ends in a fresh login-code being set and the user being signed in.
    multipleFailedRows,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({ ...match, eventName: "login_success" }),
    AnalyticsEvent.countDocuments({ ...match, eventName: "login_failed" }),
    AnalyticsEvent.countDocuments({ ...match, eventName: "otp_requested", "metadata.purpose": "reset" }),
    AnalyticsEvent.countDocuments({ ...match, eventName: "otp_verified", "metadata.purpose": "reset" }),
    AnalyticsEvent.aggregate<{ _id: string; count: number }>([
      { $match: { ...match, eventName: "login_failed" } },
      { $group: { _id: "$visitorId", count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
    ]).allowDiskUse(true),
  ]);

  const now = new Date();
  const [dau, wau, mau, totalRegistered, totalAnonymous] = await Promise.all([
    distinctValues(AnalyticsEvent, "userId", { eventName: "login_success", timestamp: { $gte: daysAgo(1, now) }, userId: { $ne: null } }),
    distinctValues(AnalyticsEvent, "userId", { eventName: "login_success", timestamp: { $gte: startOfWeek(now) }, userId: { $ne: null } }),
    distinctValues(AnalyticsEvent, "userId", { eventName: "login_success", timestamp: { $gte: startOfMonth(now) }, userId: { $ne: null } }),
    // "Registered" = has actually linked a mobile number — see businessAnalyticsService's
    // identical fix for why a plain countDocuments() no longer means this.
    User.countDocuments({ mobile: { $exists: true, $ne: null } }),
    User.countDocuments({ mobile: { $exists: false } }),
  ]);

  const recentlyLoggedInUserIds = await distinctValues(AnalyticsEvent, "userId", {
    eventName: "login_success",
    timestamp: { $gte: daysAgo(30, now) },
    userId: { $ne: null },
  });
  const inactiveUsers = Math.max(0, totalRegistered - recentlyLoggedInUserIds.length);

  return {
    loginSuccess,
    loginFailed,
    forgotPasswordRequests,
    otpLoginSuccess,
    usersWithMultipleFailedAttempts: multipleFailedRows.length,
    dailyActiveUsers: dau.length,
    weeklyActiveUsers: wau.length,
    monthlyActiveUsers: mau.length,
    inactiveUsers,
    totalRegisteredUsers: totalRegistered,
    totalAnonymousUsers: totalAnonymous,
  };
}
