import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import { HOME_LAYOUT_STORAGE_KEY, writePersistedLayout } from "@/lib/layout-cache";
import {
  DEFAULT_HUB_LAYOUT,
  hubCardLabel,
  LIVE_TOGGLE_IDS,
  mergeHubLayout,
  moveHubCard,
  sortedHubLayout,
  type HubLayoutEntry,
} from "@/features/welcome/hub-widget-registry";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

function HomeCardRow({
  entry,
  isFirst,
  isLast,
  onToggleVisible,
  onToggleLive,
  onMove,
}: {
  entry: HubLayoutEntry;
  isFirst: boolean;
  isLast: boolean;
  onToggleVisible: () => void;
  onToggleLive: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div
      className={`bg-card flex items-center gap-2 rounded-xl border px-3 py-2.5 ${entry.visible ? "" : "opacity-50"}`}
    >
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Move up"
        >
          <ArrowUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast}
          className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Move down"
        >
          <ArrowDown className="size-3.5" />
        </button>
      </div>
      <span className="flex-1 truncate text-sm font-medium">{hubCardLabel(entry.id)}</span>
      {LIVE_TOGGLE_IDS.has(entry.id) && (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Live</span>
          <Switch checked={entry.live} onCheckedChange={onToggleLive} aria-label="Toggle live" />
        </div>
      )}
      <button
        type="button"
        onClick={onToggleVisible}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label={entry.visible ? "Hide card" : "Show card"}
      >
        {entry.visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
      </button>
    </div>
  );
}

export function HomeCardsEditorView() {
  const [entries, setEntries] = useState<HubLayoutEntry[]>(DEFAULT_HUB_LAYOUT);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/home/layout")
      .then((res) => {
        setEntries(mergeHubLayout(res.widgets));
      })
      .catch(() => {
        toast.error("Failed to load the current home card visibility");
      });
  }, []);

  function toggleVisible(id: string) {
    setEntries((current) => current.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e)));
    setIsDirty(true);
  }

  function toggleLive(id: string) {
    setEntries((current) => current.map((e) => (e.id === id ? { ...e, live: !e.live } : e)));
    setIsDirty(true);
  }

  function handleMove(id: string, direction: -1 | 1) {
    setEntries((current) => moveHubCard(current, id, direction));
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.put("/api/admin/home-layout", { widgets: entries });
      // Keep this browser's persisted copy in step with what we just saved, so the admin's own
      // next visit to the home page paints the new layout rather than briefly replaying the old
      // one back at them before the refetch lands.
      writePersistedLayout(HOME_LAYOUT_STORAGE_KEY, entries);
      toast.success("Home cards saved");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  const sorted = sortedHubLayout(entries);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home cards</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Hide or show cards on the home hub (/home) that every student sees after signing in, and reorder
          them with the arrows. These also populate the mobile "more" (⋮) menu, grouped by section.
        </p>
        <div className="flex flex-col gap-2">
          {sorted.map((entry, index) => (
            <HomeCardRow
              key={entry.id}
              entry={entry}
              isFirst={index === 0}
              isLast={index === sorted.length - 1}
              onToggleVisible={() => toggleVisible(entry.id)}
              onToggleLive={() => toggleLive(entry.id)}
              onMove={(direction) => handleMove(entry.id, direction)}
            />
          ))}
        </div>
        <Button onClick={handleSave} disabled={!isDirty || isSaving} className="self-start">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
