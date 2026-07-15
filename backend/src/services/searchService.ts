import { connectDB } from "@/db";
import { ChecklistItem } from "@/models/ChecklistItem";
import { isLegacyChecklistUser, listItemsForUser } from "@/services/userChecklistService";
import { Bag } from "@/models/Bag";
import { BudgetEntry } from "@/models/BudgetEntry";
import { Note } from "@/models/Note";
import { DocumentItem } from "@/models/DocumentItem";
import { EmergencyContact } from "@/models/EmergencyContact";
import { WishlistItem } from "@/models/WishlistItem";
import { GuideArticle } from "@/models/GuideArticle";
import { Community } from "@/models/Community";
import { User } from "@/models/User";

export interface SearchResult {
  type: "checklist" | "bag" | "budget" | "note" | "document" | "contact" | "wishlist" | "guide" | "community" | "user";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
  completed?: boolean;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function globalSearch(userId: string, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  await connectDB();

  const regex = new RegExp(escapeRegex(query.trim()), "i");

  const searchChecklist = async () => {
    if (await isLegacyChecklistUser(userId)) {
      return ChecklistItem.find({ userId, item: regex }).limit(5).lean();
    }
    const items = await listItemsForUser(userId);
    return items.filter((i) => regex.test(i.item)).slice(0, 5);
  };

  const [checklist, bags, budget, notes, documents, contacts, wishlist, guide, communities, users] = await Promise.all([
    searchChecklist(),
    Bag.find({ userId, name: regex }).limit(5).lean(),
    BudgetEntry.find({ userId, title: regex }).limit(5).lean(),
    Note.find({ userId, $or: [{ title: regex }, { content: regex }] }).limit(5).lean(),
    DocumentItem.find({ userId, title: regex }).limit(5).lean(),
    EmergencyContact.find({ userId, name: regex }).limit(5).lean(),
    WishlistItem.find({ userId, item: regex }).limit(5).lean(),
    // Guide articles are shared content, not scoped to a user.
    GuideArticle.find({ $or: [{ title: regex }, { summary: regex }, { content: regex }] })
      .limit(5)
      .lean(),
    // Communities/users are shared, public content too — searchable by anyone, not scoped to
    // the requesting user's own data like the sections above.
    Community.find({ active: true, visibility: "public", name: regex }).limit(5).lean(),
    // Username only — never matches on real name/mobile, keeping the "communicate by
    // username only" privacy rule intact even inside global search.
    User.find({ username: regex }).select("username displayName avatar verified").limit(5).lean(),
  ]);

  const bagIds = [...new Set(checklist.map((c) => c.bagId).filter(Boolean).map(String))];
  const assignedBags = bagIds.length
    ? await Bag.find({ userId, _id: { $in: bagIds } }).lean()
    : [];
  const bagNameById = new Map(assignedBags.map((b) => [String(b._id), b.name]));

  return [
    ...checklist.map((c) => {
      const bagName = c.bagId ? bagNameById.get(String(c.bagId)) : undefined;
      return {
        type: "checklist" as const,
        id: c._id.toString(),
        title: c.item,
        subtitle: [c.category, bagName ?? "No bag", c.completed ? "Packed" : "Unpacked"].join(" · "),
        href: `/checklist/${encodeURIComponent(c.category)}`,
        imageUrl: c.imageUrl ?? null,
        completed: c.completed,
      };
    }),
    ...bags.map((b) => ({
      type: "bag" as const,
      id: b._id.toString(),
      title: b.name,
      subtitle: "Bag",
      href: `/bags/${b._id.toString()}`,
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
    ...guide.map((g) => ({
      type: "guide" as const,
      id: g._id.toString(),
      title: g.title,
      subtitle: g.summary || undefined,
      href: `/guide/${g.slug}`,
    })),
    ...communities.map((c) => ({
      type: "community" as const,
      id: c._id.toString(),
      title: c.name,
      subtitle: `${c.memberCount} members`,
      href: `/community/${c.slug}`,
    })),
    ...users.map((u) => ({
      type: "user" as const,
      id: u._id.toString(),
      title: `@${u.username}`,
      subtitle: u.displayName || undefined,
      href: `/u/${u.username}`,
      imageUrl: u.avatar ?? null,
    })),
  ];
}
