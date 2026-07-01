import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getAllItemsByCategory, getOverallProgress } from "@/services/checklistService";
import { toPlain } from "@/lib/serialize";
import { ChecklistOverview } from "@/features/checklist/checklist-overview";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

export const metadata: Metadata = { title: "Packing Checklist — Hostel Essentials" };

export default async function ChecklistPage() {
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

  return <ChecklistOverview groups={groups} overall={overall} />;
}
