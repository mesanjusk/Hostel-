import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Suggestion { item: string; category: string; usersUsing: number; completionRate: number; firstAdded: string; lastUsed: string }
export default function AdminSuggestedItemsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => { api.get<{ suggestions: Suggestion[] }>("/api/admin/suggested-checklist-items").then(({ suggestions }) => setSuggestions(suggestions)).catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to load suggestions")); }, []);
  async function add(s: Suggestion) { await api.post("/api/admin/default-checklist-items", { title: s.item, category: s.category, priority: "medium", isForAllCollegeCategories: true, isForAllCourses: true, active: true }); setSuggestions((prev) => prev.filter((x) => x.item !== s.item)); }
  return <div><AdminTabs /><div className="grid gap-3">{suggestions.map((s) => <Card key={`${s.category}-${s.item}`}><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium capitalize">{s.item}</p><p className="text-muted-foreground text-sm">{s.category} · {s.usersUsing} users · {s.completionRate}% complete</p></div><Button onClick={() => add(s)}>Add To Default</Button></CardContent></Card>)}</div></div>;
}
