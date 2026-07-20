import { connectDB } from "@/db";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { UserChecklist } from "@/models/UserChecklist";
import { countProducts } from "@/services/productService";
import { countGuideArticles } from "@/services/guideService";
import { countActiveUsers } from "@/services/userService";

interface CategoryRow {
  _id: string;
  total: number;
  completed: number;
}

export async function getAdminAnalytics() {
  await connectDB();

  const [
    totalUsers,
    registeredUsers,
    anonymousUsers,
    activeUsers7d,
    activeUsers30d,
    legacyTotalItems,
    legacyCompletedItems,
    legacyCategoryRows,
    v2TotalItems,
    v2CompletedItems,
    v2CategoryRows,
    totalProducts,
    totalGuideArticles,
  ] = await Promise.all([
    // Admin-dashboard-only reads — safe to prefer a secondary so this doesn't compete with
    // the operational write path (checklist toggles, etc.) once this is a multi-node replica
    // set. Never applied to the per-student checklist read/write path.
    User.countDocuments().read("secondaryPreferred"),
    // "Registered" = has actually linked a mobile number — an anonymous visitor is a real User
    // document from their first page load (see userService.createAnonymousUser), so plain
    // countDocuments() alone can no longer stand in for "registered" the way it used to.
    User.countDocuments({ mobile: { $exists: true, $ne: null } }).read("secondaryPreferred"),
    User.countDocuments({ mobile: { $exists: false } }).read("secondaryPreferred"),
    countActiveUsers(7),
    countActiveUsers(30),
    ChecklistItem.countDocuments().read("secondaryPreferred"),
    ChecklistItem.countDocuments({ completed: true }).read("secondaryPreferred"),
    ChecklistItem.aggregate<CategoryRow>([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$completed", 1, 0] } },
        },
      },
    ])
      .allowDiskUse(true)
      .read("secondaryPreferred"),
    // UserChecklist (the DB-driven, post-migration architecture) — combined with the legacy
    // counts above so this dashboard reflects every user regardless of which architecture
    // generated their checklist. See services/userChecklistService.ts.
    UserChecklist.countDocuments({ deleted: false }).read("secondaryPreferred"),
    UserChecklist.countDocuments({ deleted: false, checked: true }).read("secondaryPreferred"),
    UserChecklist.aggregate<CategoryRow>([
      { $match: { deleted: false } },
      {
        $lookup: {
          from: "defaultchecklistitems",
          localField: "defaultChecklistItemId",
          foreignField: "_id",
          as: "master",
        },
      },
      { $unwind: { path: "$master", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$master.category", "$customCategory"] },
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$checked", 1, 0] } },
        },
      },
    ])
      .allowDiskUse(true)
      .read("secondaryPreferred"),
    countProducts(),
    countGuideArticles(),
  ]);

  const totalItems = legacyTotalItems + v2TotalItems;
  const completedItems = legacyCompletedItems + v2CompletedItems;

  const categoryTotals = new Map<string, { total: number; completed: number }>();
  for (const row of [...legacyCategoryRows, ...v2CategoryRows]) {
    if (!row._id) continue;
    const entry = categoryTotals.get(row._id) ?? { total: 0, completed: 0 };
    entry.total += row.total;
    entry.completed += row.completed;
    categoryTotals.set(row._id, entry);
  }
  const categoryBreakdown = Array.from(categoryTotals.entries()).map(([category, stats]) => ({
    category,
    ...stats,
  }));

  return {
    totalUsers,
    registeredUsers,
    anonymousUsers,
    activeUsers7d,
    activeUsers30d,
    totalItems,
    completedItems,
    completionRate: totalItems === 0 ? 0 : (completedItems / totalItems) * 100,
    categoryBreakdown,
    totalProducts,
    totalGuideArticles,
  };
}
