import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

import { AdminTabs } from "@/features/admin/admin-tabs";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DefaultItem { _id: string; category: string; title: string; priority: string; active: boolean; analytics?: { usersUsing: number; completed: number; skipped: number } }

export default function AdminDefaultChecklistPage() {
  const [items, setItems] = useState<DefaultItem[]>([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Miscellaneous");

  async function load() {
    const data = await api.get<{ items: DefaultItem[] }>(`/api/admin/default-checklist-items?search=${encodeURIComponent(search)}`);
    setItems(data.items);
  }
  useEffect(() => { load().catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to load checklist")); }, []);

  async function add() {
    await api.post("/api/admin/default-checklist-items", { title, category, priority: "medium", isForAllCollegeCategories: true, isForAllCourses: true, active: true });
    setTitle("");
    await load();
  }
  async function toggle(item: DefaultItem) { await api.patch(`/api/admin/default-checklist-items/${item._id}`, { active: !item.active }); await load(); }
  async function remove(id: string) { await api.delete(`/api/admin/default-checklist-items/${id}`); await load(); }

  return <div><AdminTabs /><div className="flex flex-col gap-4">
    <Card><CardHeader><CardTitle>Default Checklist Master Data</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title" />
      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
      <Button onClick={add} disabled={!title.trim()}><Plus className="size-4" /> Add</Button>
    </CardContent></Card>
    <div className="relative max-w-md"><Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} placeholder="Search default checklist" /></div>
    <div className="grid gap-3">{items.map((item) => {
      const completion = item.analytics?.usersUsing ? Math.round(((item.analytics.completed ?? 0) / item.analytics.usersUsing) * 100) : 0;
      return <Card key={item._id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{item.title}</p><p className="text-muted-foreground text-sm">{item.category} · {item.priority} · {completion}% completion · {item.analytics?.usersUsing ?? 0} users</p></div><div className="flex gap-2"><Badge variant={item.active ? "default" : "outline"}>{item.active ? "Active" : "Inactive"}</Badge><Button variant="outline" size="sm" onClick={() => toggle(item)}>{item.active ? "Deactivate" : "Activate"}</Button><Button variant="destructive" size="sm" onClick={() => remove(item._id)}>Delete</Button></div></CardContent></Card>;
    })}</div>
  </div></div>;
}
