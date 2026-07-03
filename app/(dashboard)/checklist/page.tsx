import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getAllItemsByCategory, getOverallProgress } from "@/services/checklistService";
import { toPlain } from "@/lib/serialize";
import { ChecklistOverview } from "@/features/checklist/checklist-overview";
import { NotebookView } from "@/features/checklist/notebook-view";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

export const metadata: Metadata = { title: "Packing Checklist — Pack with Me" };

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ bulkEdit?: string; view?: string }>;
}) {
  const { bulkEdit, view } = await searchParams;
  const session = await auth();
  const [grouped, overall] = await Promise.all([
    getAllItemsByCategory(session!.user.id),
    getOverallProgress(session!.user.id),
  ]);

  const plainGrouped = toPlain(grouped);

  const groups = plainGrouped.map((g) => ({
    category: g.category,
    items: g.items.map(
      (i): ChecklistItemDTO => ({
        id: i._id,
        category: i.category,
        item: i.item,
        description: i.description ?? "",
        imageUrl: i.imageUrl ?? null,
        completed: i.completed,
        priority: i.priority,
        price: i.price ?? null,
        priceRangeMin: i.priceRangeMin ?? null,
        priceRangeMax: i.priceRangeMax ?? null,
        recommendedBrand: i.recommendedBrand ?? null,
        recommendedStore: i.recommendedStore ?? null,
        purchaseLink: i.purchaseLink ?? null,
        studentRating: i.studentRating ?? null,
        importance: i.importance ?? "",
      }),
    ),
  }));

  const allCategories = groups.map((g) => g.category);

  if (view === "list" || bulkEdit === "1") {
    return <ChecklistOverview groups={groups} overall={overall} initialBulkEdit={bulkEdit === "1"} />;
  }

  return <NotebookView groups={groups} overall={overall} allCategories={allCategories} />;
}
