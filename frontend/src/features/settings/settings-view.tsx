import { useState, type ElementType, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListChecks, Loader2, LogOut, Moon, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { BulkAddDialog } from "@/features/checklist/bulk-add-dialog";
import { CategoryManagerDialog } from "@/features/checklist/category-manager-dialog";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { emitRefresh } from "@/lib/refresh-bus";

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase">{title}</h2>
      <Card className="gap-0 divide-y divide-border/60 overflow-hidden p-0">{children}</Card>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  description,
  action,
}: {
  icon: ElementType;
  label: string;
  description?: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SettingsView({ categories }: { categories: string[] }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoadingStarter, setIsLoadingStarter] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  async function handleLoadStarterChecklist() {
    setIsLoadingStarter(true);
    try {
      const result = await api.post<{ count: number }>("/api/checklist/load-starter");
      emitRefresh();
      toast.success(
        result.count > 0
          ? `Added ${result.count} new item${result.count === 1 ? "" : "s"} from the starter checklist`
          : "You already have every starter checklist item",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsLoadingStarter(false);
    }
  }

  async function handleMergeDuplicates() {
    setIsMerging(true);
    try {
      const result = await api.post<{ mergedCount: number }>("/api/checklist/merge-duplicates");
      emitRefresh();
      toast.success(
        result.mergedCount > 0
          ? `Merged ${result.mergedCount} duplicate item${result.mergedCount === 1 ? "" : "s"}`
          : "No duplicate items found",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    } finally {
      setIsMerging(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <PageHeader title="Settings" description="Appearance, checklist tools, and your account" />

      <SettingsSection title="Appearance">
        <SettingsRow icon={Moon} label="Theme" description="Light or dark" action={<ThemeToggle />} />
      </SettingsSection>

      <SettingsSection title="Checklist tools">
        <SettingsRow
          icon={ListChecks}
          label="Bulk add items"
          description="Paste a list of item names into a category at once"
          action={<BulkAddDialog categories={categories} />}
        />
        <SettingsRow
          icon={ListChecks}
          label="Manage categories"
          description="Add, rename, or delete your packing categories"
          action={<CategoryManagerDialog />}
        />
        <SettingsRow
          icon={ListChecks}
          label="Bulk edit"
          description="Select multiple items on the Checklist screen"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link to="/checklist?bulkEdit=1">Open</Link>
            </Button>
          }
        />
        <SettingsRow
          icon={Sparkles}
          label="Load starter checklist"
          description="Add any missing items from the default packing list"
          action={
            <Button variant="outline" size="sm" onClick={handleLoadStarterChecklist} disabled={isLoadingStarter}>
              {isLoadingStarter && <Loader2 className="size-4 animate-spin" />}
              Load
            </Button>
          }
        />
        <SettingsRow
          icon={Wand2}
          label="Clean up duplicates"
          description="Merge near-duplicate items like typos and repeats"
          action={
            <Button variant="outline" size="sm" onClick={handleMergeDuplicates} disabled={isMerging}>
              {isMerging && <Loader2 className="size-4 animate-spin" />}
              Clean up
            </Button>
          }
        />
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsRow
          icon={LogOut}
          label="Log out"
          action={
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          }
        />
      </SettingsSection>
    </div>
  );
}
