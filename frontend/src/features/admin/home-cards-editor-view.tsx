import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { DEFAULT_HUB_LAYOUT, hubCardLabel, mergeHubLayout } from "@/features/welcome/hub-widget-registry";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

export function HomeCardsEditorView() {
  const [items, setItems] = useState<WidgetConfig[]>(DEFAULT_HUB_LAYOUT);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/home/layout")
      .then((res) => {
        setItems(mergeHubLayout(res.widgets));
      })
      .catch(() => {
        toast.error("Failed to load the current home card visibility");
      });
  }, []);

  function toggleVisible(id: string) {
    setItems((current) => current.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.put("/api/admin/home-layout", { widgets: items });
      toast.success("Home cards saved");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home cards</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Hide or show cards on the home hub (/wa-login/home) that every student sees after signing in.
        </p>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-card flex items-center gap-3 rounded-xl border px-3 py-3 ${item.visible ? "" : "opacity-50"}`}
            >
              <span className="flex-1 text-sm font-medium">{hubCardLabel(item.id)}</span>
              <button
                type="button"
                onClick={() => toggleVisible(item.id)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={item.visible ? "Hide card" : "Show card"}
              >
                {item.visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
              </button>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={!isDirty || isSaving} className="self-start">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
