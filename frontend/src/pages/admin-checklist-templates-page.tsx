import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { ChecklistTemplatesView } from "@/features/admin/checklist-templates-view";
import {
  toChecklistTemplateDTO,
  type ChecklistTemplateDTO,
  type ChecklistTemplateRaw,
} from "@/features/admin/checklist-template-dto";

export default function AdminChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplateDTO[]>([]);

  async function fetchData() {
    try {
      const { templates: raw } = await api.get<{ templates: ChecklistTemplateRaw[] }>("/api/admin/checklist-templates");
      setTemplates(raw.map(toChecklistTemplateDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load templates");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <ChecklistTemplatesView templates={templates} />
    </div>
  );
}
