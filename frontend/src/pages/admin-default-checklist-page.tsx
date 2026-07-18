import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { CategoryOrderEditor } from "@/features/admin/category-order-editor";
import { DefaultChecklistItemsView } from "@/features/admin/default-checklist-items-view";
import {
  toDefaultChecklistItemDTO,
  type DefaultChecklistItemDTO,
  type DefaultChecklistItemRaw,
} from "@/features/admin/default-checklist-item-dto";
import {
  toCollegeCategoryDTO,
  toCourseDTO,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
  type CourseDTO,
  type CourseRaw,
} from "@/features/auth/college-taxonomy-dto";

const PAGE_SIZE = 25;

export default function AdminDefaultChecklistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const gender = searchParams.get("gender") ?? "";
  const active = searchParams.get("active") ?? "";

  const [items, setItems] = useState<DefaultChecklistItemDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [collegeCategories, setCollegeCategories] = useState<CollegeCategoryDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);

  async function fetchData() {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (gender) params.set("gender", gender);
      if (active) params.set("active", active);

      const [itemsResult, categoriesResult, collegeCategoriesResult, coursesResult] = await Promise.all([
        api.get<{ items: DefaultChecklistItemRaw[]; total: number }>(
          `/api/admin/default-checklist-items?${params.toString()}`,
        ),
        api.get<{ categories: string[] }>("/api/admin/default-checklist-items/categories"),
        api.get<{ collegeCategories: CollegeCategoryRaw[] }>("/api/admin/college-categories"),
        api.get<{ courses: CourseRaw[] }>("/api/admin/courses"),
      ]);

      setItems(itemsResult.items.map(toDefaultChecklistItemDTO));
      setTotal(itemsResult.total);
      setCategoryOptions(categoriesResult.categories);
      setCollegeCategories(collegeCategoriesResult.collegeCategories.map(toCollegeCategoryDTO));
      setCourses(coursesResult.courses.map(toCourseDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load checklist items");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category, gender, active]);

  async function fetchAllForExport(): Promise<DefaultChecklistItemDTO[]> {
    const EXPORT_PAGE_SIZE = 200;
    const params = new URLSearchParams({ pageSize: String(EXPORT_PAGE_SIZE) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (gender) params.set("gender", gender);
    if (active) params.set("active", active);

    const all: DefaultChecklistItemRaw[] = [];
    let currentPage = 1;
    for (;;) {
      params.set("page", String(currentPage));
      const result = await api.get<{ items: DefaultChecklistItemRaw[]; total: number }>(
        `/api/admin/default-checklist-items?${params.toString()}`,
      );
      all.push(...result.items);
      if (all.length >= result.total || result.items.length === 0) break;
      currentPage += 1;
    }
    return all.map(toDefaultChecklistItemDTO);
  }

  function updateParams(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminTabs />
      <CategoryOrderEditor />
      <DefaultChecklistItemsView
        items={items}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        category={category}
        gender={gender}
        active={active}
        categoryOptions={categoryOptions}
        collegeCategories={collegeCategories}
        courses={courses}
        onSearchChange={(value) => updateParams({ search: value })}
        onCategoryChange={(value) => updateParams({ category: value })}
        onGenderChange={(value) => updateParams({ gender: value })}
        onActiveChange={(value) => updateParams({ active: value })}
        onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
        onExportAll={fetchAllForExport}
      />
    </div>
  );
}
