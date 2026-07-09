import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { GuideAdminView } from "@/features/admin/guide-admin-view";
import {
  toAdminGuideArticleDTO,
  type AdminGuideArticleDTO,
  type AdminGuideArticleRaw,
} from "@/features/admin/guide-admin-dto";

export default function AdminGuidePage() {
  const [articles, setArticles] = useState<AdminGuideArticleDTO[]>([]);

  async function fetchData() {
    try {
      const { articles: raw } = await api.get<{ articles: AdminGuideArticleRaw[] }>("/api/guide");
      setArticles(raw.map(toAdminGuideArticleDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load articles");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <GuideAdminView articles={articles} />
    </div>
  );
}
