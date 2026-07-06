import { connectDB } from "@/db";
import { User } from "@/models/User";
import { ChecklistItem } from "@/models/ChecklistItem";
import { countProducts } from "@/services/productService";
import { countGuideArticles } from "@/services/guideService";
import { countActiveUsers } from "@/services/userService";

export async function getAdminAnalytics() {
  await connectDB();

  const [totalUsers, activeUsers7d, activeUsers30d, totalItems, completedItems, categoryRows, totalProducts, totalGuideArticles] =
    await Promise.all([
      User.countDocuments(),
      countActiveUsers(7),
      countActiveUsers(30),
      ChecklistItem.countDocuments(),
      ChecklistItem.countDocuments({ completed: true }),
      ChecklistItem.aggregate<{ _id: string; total: number; completed: number }>([
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            completed: { $sum: { $cond: ["$completed", 1, 0] } },
          },
        },
      ]),
      countProducts(),
      countGuideArticles(),
    ]);

  const categoryBreakdown = categoryRows.map((row) => ({
    category: row._id,
    total: row.total,
    completed: row.completed,
  }));

  return {
    totalUsers,
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
