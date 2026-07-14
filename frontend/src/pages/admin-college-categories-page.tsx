import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { CollegeCategoriesView } from "@/features/admin/college-categories-view";
import {
  toCollegeCategoryDTO,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
} from "@/features/auth/college-taxonomy-dto";

export default function AdminCollegeCategoriesPage() {
  const [categories, setCategories] = useState<CollegeCategoryDTO[]>([]);

  async function fetchData() {
    try {
      const { collegeCategories: raw } = await api.get<{ collegeCategories: CollegeCategoryRaw[] }>(
        "/api/admin/college-categories",
      );
      setCategories(raw.map(toCollegeCategoryDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load college categories");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
  }, []);

  return (
    <div>
      <AdminTabs />
      <CollegeCategoriesView categories={categories} />
    </div>
  );
}
