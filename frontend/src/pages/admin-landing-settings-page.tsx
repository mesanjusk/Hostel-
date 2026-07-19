import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { LandingSettingsView } from "@/features/admin/landing-settings-view";
import type { LandingPageSettingsDTO } from "@/features/admin/landing-settings-dto";

export default function AdminLandingSettingsPage() {
  const [settings, setSettings] = useState<LandingPageSettingsDTO | null>(null);

  async function fetchData() {
    try {
      const { settings: raw } = await api.get<{ settings: LandingPageSettingsDTO }>("/api/admin/landing-settings");
      setSettings(raw);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load landing page settings");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <LandingSettingsView settings={settings} />
    </div>
  );
}
