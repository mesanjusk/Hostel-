import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { WhatsAppCampaignView } from "@/features/admin/whatsapp-campaign-view";
import type { AdminWaStatusDTO, WhatsAppCampaignSettingsDTO } from "@/features/admin/whatsapp-campaign-dto";

export default function AdminWhatsAppCampaignPage() {
  const [settings, setSettings] = useState<WhatsAppCampaignSettingsDTO | null>(null);
  const [admins, setAdmins] = useState<AdminWaStatusDTO[]>([]);

  async function fetchData() {
    try {
      const data = await api.get<{ settings: WhatsAppCampaignSettingsDTO; admins: AdminWaStatusDTO[] }>(
        "/api/admin/whatsapp-campaign",
      );
      setSettings(data.settings);
      setAdmins(data.admins);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load WhatsApp campaign settings");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <WhatsAppCampaignView settings={settings} admins={admins} />
    </div>
  );
}
