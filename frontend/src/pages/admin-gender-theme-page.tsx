import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { GenderThemeView } from "@/features/admin/gender-theme-view";
import type { GenderThemeSettingsMap } from "@/features/admin/gender-theme-dto";

export default function AdminGenderThemePage() {
  const [settings, setSettings] = useState<GenderThemeSettingsMap | null>(null);

  async function fetchData() {
    try {
      const { settings: raw } = await api.get<{ settings: GenderThemeSettingsMap }>("/api/admin/gender-theme");
      setSettings(raw);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load gender theme settings");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <GenderThemeView settings={settings} />
    </div>
  );
}
