import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { BudgetEntry } from "@/models/BudgetEntry";
import { Note } from "@/models/Note";
import { DocumentItem } from "@/models/DocumentItem";
import { EmergencyContact } from "@/models/EmergencyContact";
import { WishlistItem } from "@/models/WishlistItem";

export interface SearchResult {
  type: "checklist" | "budget" | "note" | "document" | "contact" | "wishlist";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function globalSearch(userId: string, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  await connectDB();

  const regex = new RegExp(escapeRegex(query.trim()), "i");

  const [checklist, budget, notes, documents, contacts, wishlist] = await Promise.all([
    ChecklistItem.find({ userId, item: regex }).limit(5).lean(),
    BudgetEntry.find({ userId, title: regex }).limit(5).lean(),
    Note.find({ userId, $or: [{ title: regex }, { content: regex }] }).limit(5).lean(),
    DocumentItem.find({ userId, title: regex }).limit(5).lean(),
    EmergencyContact.find({ userId, name: regex }).limit(5).lean(),
    WishlistItem.find({ userId, item: regex }).limit(5).lean(),
  ]);

  return [
    ...checklist.map((c) => ({
      type: "checklist" as const,
      id: c._id.toString(),
      title: c.item,
      subtitle: c.category,
      href: `/checklist/${encodeURIComponent(c.category)}`,
    })),
    ...budget.map((b) => ({
      type: "budget" as const,
      id: b._id.toString(),
      title: b.title,
      subtitle: `₹${b.amount}`,
      href: "/budget",
    })),
    ...notes.map((n) => ({
      type: "note" as const,
      id: n._id.toString(),
      title: n.title,
      href: "/notes",
    })),
    ...documents.map((d) => ({
      type: "document" as const,
      id: d._id.toString(),
      title: d.title,
      href: "/documents",
    })),
    ...contacts.map((c) => ({
      type: "contact" as const,
      id: c._id.toString(),
      title: c.name,
      subtitle: c.relation,
      href: "/contacts",
    })),
    ...wishlist.map((w) => ({
      type: "wishlist" as const,
      id: w._id.toString(),
      title: w.item,
      href: "/wishlist",
    })),
  ];
}
