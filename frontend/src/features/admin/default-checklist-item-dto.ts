import type { ChecklistGender, ChecklistPriority, StoreOption } from "@/types";

export interface DefaultItemAnalytics {
  usersUsing: number;
  completed: number;
  skipped: number;
  completionRate: number;
  popularityScore: number;
  mostPopularCollegeCategory: string | null;
  mostPopularCourse: string | null;
}

export interface DefaultChecklistItemDTO {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string | null;
  priority: ChecklistPriority;
  importance: string;
  estimatedPrice: number | null;
  recommendedBrand: string | null;
  recommendedStore: StoreOption | null;
  purchaseLink: string | null;
  sortOrder: number;
  gender: ChecklistGender;
  applicableCollegeCategories: string[];
  applicableCourses: string[];
  isForAllCollegeCategories: boolean;
  isForAllCourses: boolean;
  active: boolean;
  analytics: DefaultItemAnalytics | null;
}

export interface DefaultChecklistItemRaw {
  _id: string;
  category: string;
  title: string;
  description?: string;
  image?: string | null;
  priority: ChecklistPriority;
  importance?: string;
  estimatedPrice?: number | null;
  recommendedBrand?: string | null;
  recommendedStore?: StoreOption | null;
  purchaseLink?: string | null;
  sortOrder: number;
  gender?: ChecklistGender;
  applicableCollegeCategories: string[];
  applicableCourses: string[];
  isForAllCollegeCategories: boolean;
  isForAllCourses: boolean;
  active: boolean;
  analytics?: DefaultItemAnalytics | null;
}

export function toDefaultChecklistItemDTO(raw: DefaultChecklistItemRaw): DefaultChecklistItemDTO {
  return {
    id: raw._id,
    category: raw.category,
    title: raw.title,
    description: raw.description ?? "",
    image: raw.image ?? null,
    priority: raw.priority,
    importance: raw.importance ?? "",
    estimatedPrice: raw.estimatedPrice ?? null,
    recommendedBrand: raw.recommendedBrand ?? null,
    recommendedStore: raw.recommendedStore ?? null,
    purchaseLink: raw.purchaseLink ?? null,
    sortOrder: raw.sortOrder,
    gender: raw.gender ?? "All",
    applicableCollegeCategories: (raw.applicableCollegeCategories ?? []).map(String),
    applicableCourses: (raw.applicableCourses ?? []).map(String),
    isForAllCollegeCategories: raw.isForAllCollegeCategories,
    isForAllCourses: raw.isForAllCourses,
    active: raw.active,
    analytics: raw.analytics ?? null,
  };
}
