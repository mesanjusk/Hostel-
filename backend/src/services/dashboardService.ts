import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { Note } from "@/models/Note";
import { getCategorySummaries, getOverallProgress } from "@/services/checklistService";
import { hasUserChecklist, listItemsForUser } from "@/services/userChecklistService";
import { getBudgetSummary } from "@/services/budgetService";
import { WishlistItem } from "@/models/WishlistItem";
import { BudgetEntry } from "@/models/BudgetEntry";

async function getRecentChecklistActivity(userId: string) {
  if (await hasUserChecklist(userId)) {
    const items = await listItemsForUser(userId);
    const upcomingTasks = [...items]
      .filter((i) => !i.completed)
      .sort((a, b) => {
        const priorityRank = { high: 2, medium: 1, low: 0 } as const;
        const rankDiff = priorityRank[a.priority as keyof typeof priorityRank] - priorityRank[b.priority as keyof typeof priorityRank];
        return rankDiff !== 0 ? -rankDiff : b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, 5);
    const recentChecklist = [...items].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);
    return { upcomingTasks, recentChecklist };
  }

  const [upcomingTasks, recentChecklist] = await Promise.all([
    ChecklistItem.find({ userId, completed: false }).sort({ priority: -1, createdAt: -1 }).limit(5).lean(),
    ChecklistItem.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);
  return { upcomingTasks, recentChecklist };
}

export interface ActivityEntry {
  id: string;
  type: "checklist" | "budget" | "note";
  label: string;
  timestamp: Date;
}

export async function getDashboardData(userId: string) {
  await connectDB();

  const [
    categorySummaries,
    overallProgress,
    budgetSummary,
    wishlistCount,
    { upcomingTasks, recentChecklist },
    recentBudget,
    recentNotes,
  ] = await Promise.all([
    getCategorySummaries(userId),
    getOverallProgress(userId),
    getBudgetSummary(userId),
    WishlistItem.countDocuments({ userId, purchased: false }),
    getRecentChecklistActivity(userId),
    BudgetEntry.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean(),
    Note.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);

  const activity: ActivityEntry[] = [
    ...recentChecklist.map((c) => ({
      id: c._id.toString(),
      type: "checklist" as const,
      label: `${c.completed ? "Completed" : "Added"} "${c.item}" in ${c.category}`,
      timestamp: c.updatedAt as Date,
    })),
    ...recentBudget.map((b) => ({
      id: b._id.toString(),
      type: "budget" as const,
      label: `${b.type === "expense" ? "Spent" : "Planned"} ₹${b.amount} on ${b.title}`,
      timestamp: b.updatedAt as Date,
    })),
    ...recentNotes.map((n) => ({
      id: n._id.toString(),
      type: "note" as const,
      label: `Note "${n.title}" updated`,
      timestamp: n.updatedAt as Date,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  return {
    categorySummaries,
    overallProgress,
    budgetSummary,
    wishlistCount,
    upcomingTasks,
    activity,
  };
}
