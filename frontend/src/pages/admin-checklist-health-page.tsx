import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { AdminTabs } from "@/features/admin/admin-tabs";

interface TemplateSummary {
  id: string;
  name: string;
  version: number;
  active: boolean;
  itemCount: number;
}

interface UserSnapshot {
  found: boolean;
  mobile?: string;
  id?: string;
  name?: string | null;
  needsOnboarding?: boolean;
  collegeCategoryId?: string | null;
  courseId?: string | null;
  gender?: string | null;
  userChecklistCount?: number;
  legacyChecklistItemCount?: number;
  categoryFolderNames?: string[];
  legacyItemCategoryNames?: string[];
}

interface HealthSnapshot {
  checklistTemplates: TemplateSummary[];
  defaultChecklistItemCount: number;
  collegeCategoryCount: number;
  courseCount: number;
  user?: UserSnapshot;
}

/** Read-only diagnostic view of the checklist self-heal seeds, so an admin can confirm whether
 * DefaultChecklistItem/CollegeCategory actually have data in production — from a phone, using
 * the same authenticated session as the rest of the admin panel — without needing DB access or
 * browser devtools. */
export default function AdminChecklistHealthPage() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState("");

  async function fetchData(withMobile?: string) {
    setLoading(true);
    try {
      const query = withMobile ? `?mobile=${encodeURIComponent(withMobile)}` : "";
      const data = await api.get<HealthSnapshot>(`/api/admin/checklist-health${query}`);
      setSnapshot(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load checklist health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <AdminTabs />

      <Card className="mb-4 p-4">
        <h2 className="mb-1 text-sm font-semibold">Checklist taxonomy</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          Confirms whether the starter catalog has actually been seeded in this environment.
        </p>
        {loading && !snapshot ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : snapshot ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-muted-foreground text-xs">Default items</p>
                <p className="font-semibold">{snapshot.defaultChecklistItemCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">College categories</p>
                <p className="font-semibold">{snapshot.collegeCategoryCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Courses</p>
                <p className="font-semibold">{snapshot.courseCount}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Checklist templates</p>
              {snapshot.checklistTemplates.length === 0 ? (
                <p className="text-xs">None</p>
              ) : (
                <div className="space-y-1">
                  {snapshot.checklistTemplates.map((t) => (
                    <div key={t.id} className="bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-xs">
                      <span>
                        {t.name} v{t.version} {t.active ? "(active)" : ""}
                      </span>
                      <span className="font-semibold">{t.itemCount} items</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-4">
        <h2 className="mb-1 text-sm font-semibold">Check a specific user</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          Enter a mobile number to see their onboarding fields and checklist row counts.
        </p>
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (mobile.trim()) fetchData(mobile.trim());
          }}
        >
          <Input placeholder="10-digit mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </form>
        {snapshot?.user &&
          (snapshot.user.found ? (
            <div className="space-y-1 text-xs">
              <p>
                <span className="text-muted-foreground">Name: </span>
                {snapshot.user.name ?? "(not set — hasn't onboarded)"}
              </p>
              <p>
                <span className="text-muted-foreground">College category id: </span>
                {snapshot.user.collegeCategoryId ?? "(none)"}
              </p>
              <p>
                <span className="text-muted-foreground">Course id: </span>
                {snapshot.user.courseId ?? "(none)"}
              </p>
              <p>
                <span className="text-muted-foreground">Gender: </span>
                {snapshot.user.gender ?? "(none)"}
              </p>
              <p>
                <span className="text-muted-foreground">New checklist rows: </span>
                {snapshot.user.userChecklistCount}
              </p>
              <p>
                <span className="text-muted-foreground">Legacy checklist rows: </span>
                {snapshot.user.legacyChecklistItemCount}
              </p>
              <p>
                <span className="text-muted-foreground">Category folders ({snapshot.user.categoryFolderNames?.length ?? 0}): </span>
                {snapshot.user.categoryFolderNames?.join(", ") || "(none)"}
              </p>
              <p>
                <span className="text-muted-foreground">
                  Category names on legacy items ({snapshot.user.legacyItemCategoryNames?.length ?? 0}):{" "}
                </span>
                {snapshot.user.legacyItemCategoryNames?.join(", ") || "(none)"}
              </p>
            </div>
          ) : (
            <p className="text-xs">No account found with that mobile number.</p>
          ))}
      </Card>
    </div>
  );
}
