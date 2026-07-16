import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  ListChecks,
  Loader2,
  LogOut,
  Share,
  SquarePlus,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { BulkAddDialog } from "@/features/checklist/bulk-add-dialog";
import { CategoryManagerDialog } from "@/features/checklist/category-manager-dialog";
import { useAuth } from "@/context/auth-context";
import { usePwaInstall } from "@/lib/use-pwa-install";
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
  icon: LucideIcon;
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

function InstallAppAction() {
  const { installed, isIOS, canInstall, promptInstall } = usePwaInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  if (installed) {
    return (
      <span className="text-muted-foreground text-xs font-medium">Installed</span>
    );
  }

  if (isIOS && !canInstall) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setIosDialogOpen(true)}>
          Install
        </Button>
        <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install Pack with Me</DialogTitle>
              <DialogDescription asChild>
                <p className="flex flex-wrap items-center gap-1 pt-1 text-left">
                  Tap <Share className="mx-0.5 inline size-3.5" aria-hidden /> <strong>Share</strong> in your
                  browser toolbar, then choose <SquarePlus className="mx-0.5 inline size-3.5" aria-hidden />{" "}
                  <strong>"Add to Home Screen"</strong>.
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled={!canInstall} onClick={() => promptInstall()}>
      Install
    </Button>
  );
}

export function SettingsView({ categories }: { categories: string[] }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMerging, setIsMerging] = useState(false);

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
    navigate("/wa-login", { replace: true });
  }

  return (
    <div>
      <PageHeader title="Settings" description="Appearance, checklist tools, and your account" />

      <SettingsSection title="App">
        <SettingsRow
          icon={Download}
          label="Install app"
          description="Add Pack with Me to your home screen"
          action={<InstallAppAction />}
        />
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
