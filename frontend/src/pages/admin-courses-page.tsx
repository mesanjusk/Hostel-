import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { CoursesView } from "@/features/admin/courses-view";
import {
  toCollegeCategoryDTO,
  toCourseDTO,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
  type CourseDTO,
  type CourseRaw,
} from "@/features/auth/college-taxonomy-dto";

export default function AdminCoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = searchParams.get("collegeCategoryId") ?? "";
  const [categories, setCategories] = useState<CollegeCategoryDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);

  async function fetchData() {
    try {
      const [categoriesResult, coursesResult] = await Promise.all([
        api.get<{ collegeCategories: CollegeCategoryRaw[] }>("/api/admin/college-categories"),
        api.get<{ courses: CourseRaw[] }>(
          `/api/admin/courses${selectedCategoryId ? `?collegeCategoryId=${selectedCategoryId}` : ""}`,
        ),
      ]);
      setCategories(categoriesResult.collegeCategories.map(toCollegeCategoryDTO));
      setCourses(coursesResult.courses.map(toCourseDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load courses");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  return (
    <div>
      <AdminTabs />
      <CoursesView
        courses={courses}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => setSearchParams(id ? { collegeCategoryId: id } : {})}
      />
    </div>
  );
}
