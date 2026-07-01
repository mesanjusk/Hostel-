import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listItemsByCategory } from "@/services/checklistService";
import { toPlain } from "@/lib/serialize";
import { CHECKLIST_CATEGORIES, type ChecklistCategory } from "@/types";
import { CategoryView } from "@/features/checklist/category-view";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return { title: `${decodeURIComponent(category)} — Hostel Essentials` };
}

function isChecklistCategory(value: string): value is ChecklistCategory {
  return (CHECKLIST_CATEGORIES as readonly string[]).includes(value);
}

export default async function ChecklistCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  if (!isChecklistCategory(category)) {
    notFound();
  }

  const session = await auth();
  const items = await listItemsByCategory(session!.user.id, category);

  const initialItems: ChecklistItemDTO[] = toPlain(items).map((i) => ({
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
  }));

  return <CategoryView category={category} initialItems={initialItems} />;
}
