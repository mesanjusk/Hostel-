import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { subscribeRefresh } from "@/lib/refresh-bus";
import { AdminTabs } from "@/features/admin/admin-tabs";
import { CollegesView } from "@/features/admin/colleges-view";
import {
  toCityOptionDTO,
  toCollegeCategoryDTO,
  toCollegeDTO,
  type CityOptionDTO,
  type CityOptionRaw,
  type CollegeCategoryDTO,
  type CollegeCategoryRaw,
  type CollegeDTO,
  type CollegeRaw,
} from "@/features/auth/college-taxonomy-dto";

export default function AdminCollegesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCity = searchParams.get("city") ?? "";
  const selectedCategoryId = searchParams.get("collegeCategoryId") ?? "";
  const [cities, setCities] = useState<CityOptionDTO[]>([]);
  const [categories, setCategories] = useState<CollegeCategoryDTO[]>([]);
  const [colleges, setColleges] = useState<CollegeDTO[]>([]);

  async function fetchData() {
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.set("city", selectedCity);
      if (selectedCategoryId) params.set("collegeCategoryId", selectedCategoryId);
      const [citiesResult, categoriesResult, collegesResult] = await Promise.all([
        api.get<{ cities: CityOptionRaw[] }>("/api/admin/cities"),
        api.get<{ collegeCategories: CollegeCategoryRaw[] }>("/api/admin/college-categories"),
        api.get<{ colleges: CollegeRaw[] }>(`/api/admin/colleges${params.toString() ? `?${params}` : ""}`),
      ]);
      setCities(citiesResult.cities.map(toCityOptionDTO));
      setCategories(categoriesResult.collegeCategories.map(toCollegeCategoryDTO));
      setColleges(collegesResult.colleges.map(toCollegeDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load colleges");
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedCategoryId]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div>
      <AdminTabs />
      <CollegesView
        colleges={colleges}
        cities={cities}
        categories={categories}
        selectedCity={selectedCity}
        selectedCategoryId={selectedCategoryId}
        onSelectCity={(city) => updateParam("city", city)}
        onSelectCategory={(id) => updateParam("collegeCategoryId", id)}
      />
    </div>
  );
}
