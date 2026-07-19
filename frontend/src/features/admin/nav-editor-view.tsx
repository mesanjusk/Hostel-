import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { NAV_LAYOUT_STORAGE_KEY, writePersistedLayout } from "@/lib/layout-cache";
import {
  DEFAULT_FAB_VISIBLE,
  DEFAULT_NAV_LAYOUT,
  FAB_NAV_ID,
  MAX_BOTTOM_ITEMS,
  mergeNavLayout,
  navItemLabel,
  resolveFabVisible,
  type NavLayoutEntry,
  type NavPlacement,
} from "@/features/nav/nav-layout";
import { groupSorted, moveWithinGroup, movePlacement } from "@/features/nav/nav-editor-logic";
import { CONFIGURABLE_NAV_ITEMS } from "@/lib/nav-items";
import type { WidgetConfig } from "@/features/dashboard/widget-registry";

function NavItemRow({
  entry,
  isFirst,
  isLast,
  onToggleVisible,
  onMove,
  onPlacementChange,
}: {
  entry: NavLayoutEntry;
  isFirst: boolean;
  isLast: boolean;
  onToggleVisible: () => void;
  onMove: (direction: -1 | 1) => void;
  onPlacementChange: (placement: NavPlacement) => void;
}) {
  const item = CONFIGURABLE_NAV_ITEMS.find((i) => i.href === entry.id);
  const Icon = item?.icon;

  return (
    <div className={`bg-card flex items-center gap-2 rounded-xl border px-3 py-2.5 ${entry.visible ? "" : "opacity-50"}`}>
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
      {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
      <span className="flex-1 truncate text-sm font-medium">{navItemLabel(entry.id)}</span>
      <Select value={entry.placement} onValueChange={(value) => onPlacementChange(value as NavPlacement)}>
        <SelectTrigger className="h-8 w-[9.5rem] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bottom">Bottom bar</SelectItem>
          <SelectItem value="overflow">More (⋮) menu</SelectItem>
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={onToggleVisible}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label={entry.visible ? "Hide item" : "Show item"}
      >
        {entry.visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
      </button>
    </div>
  );
}

export function NavEditorView() {
  const [entries, setEntries] = useState<NavLayoutEntry[]>(DEFAULT_NAV_LAYOUT);
  const [fabVisible, setFabVisible] = useState(DEFAULT_FAB_VISIBLE);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ widgets: WidgetConfig[] | null }>("/api/nav/layout")
      .then((res) => {
        setEntries(mergeNavLayout(res.widgets));
        setFabVisible(resolveFabVisible(res.widgets));
      })
      .catch(() => {
        toast.error("Failed to load the current nav layout");
      });
  }, []);

  function toggleVisible(id: string) {
    setEntries((current) => current.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e)));
    setIsDirty(true);
  }

  function handleMove(id: string, direction: -1 | 1) {
    setEntries((current) => moveWithinGroup(current, id, direction));
    setIsDirty(true);
  }

  function handlePlacementChange(id: string, placement: NavPlacement) {
    setEntries((current) => {
      const result = movePlacement(current, id, placement);
      if (result.error) {
        toast.error(result.error);
        return current;
      }
      return result.entries;
    });
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const widgets = [...entries, { id: FAB_NAV_ID, visible: fabVisible }];
      await api.put("/api/admin/nav-layout", { widgets });
      // Keep this browser's persisted copy in step with what we just saved, so the admin's own
      // next load paints the new nav rather than briefly replaying the old one back at them
      // before the refetch lands.
      writePersistedLayout(NAV_LAYOUT_STORAGE_KEY, widgets);
      toast.success("Nav layout saved");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  const bottomEntries = groupSorted(entries, "bottom");
  const overflowEntries = groupSorted(entries, "overflow");

  function renderGroup(group: NavLayoutEntry[]) {
    return group.map((entry, index) => (
      <NavItemRow
        key={entry.id}
        entry={entry}
        isFirst={index === 0}
        isLast={index === group.length - 1}
        onToggleVisible={() => toggleVisible(entry.id)}
        onMove={(direction) => handleMove(entry.id, direction)}
        onPlacementChange={(placement) => handlePlacementChange(entry.id, placement)}
      />
    ));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nav items</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-muted-foreground text-sm">
          Hide or show nav items for every student, choose whether each one lives in the bottom tab bar, and
          reorder with the arrows. Items not in the bottom bar stay reachable from the desktop sidebar; on
          mobile, the "more" (⋮) menu lists the home cards instead — manage those from Home cards. Home always
          stays reachable via the logo/brand name, even if hidden here.
        </p>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            Bottom bar ({bottomEntries.length}/{MAX_BOTTOM_ITEMS})
          </h3>
          <div className="flex flex-col gap-2">{renderGroup(bottomEntries)}</div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Not in bottom bar (desktop sidebar only)</h3>
          <div className="flex flex-col gap-2">{renderGroup(overflowEntries)}</div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Floating message button</h3>
          <div className={`bg-card flex items-center gap-3 rounded-xl border px-3 py-2.5 ${fabVisible ? "" : "opacity-50"}`}>
            <span className="flex-1 text-sm font-medium">Chat message button</span>
            <button
              type="button"
              onClick={() => {
                setFabVisible((v) => !v);
                setIsDirty(true);
              }}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label={fabVisible ? "Hide message button" : "Show message button"}
            >
              {fabVisible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!isDirty || isSaving} className="self-start">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
