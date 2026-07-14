export interface CollegeCategoryDTO {
  id: string;
  name: string;
  icon: string | null;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface CollegeCategoryRaw {
  _id: string;
  name: string;
  icon?: string | null;
  description?: string;
  active: boolean;
  sortOrder: number;
}

export function toCollegeCategoryDTO(raw: CollegeCategoryRaw): CollegeCategoryDTO {
  return {
    id: raw._id,
    name: raw.name,
    icon: raw.icon ?? null,
    description: raw.description ?? "",
    active: raw.active,
    sortOrder: raw.sortOrder,
  };
}

export interface CourseDTO {
  id: string;
  collegeCategoryId: string;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface CourseRaw {
  _id: string;
  collegeCategoryId: string;
  name: string;
  description?: string;
  active: boolean;
  sortOrder: number;
}

export function toCourseDTO(raw: CourseRaw): CourseDTO {
  return {
    id: raw._id,
    collegeCategoryId: String(raw.collegeCategoryId),
    name: raw.name,
    description: raw.description ?? "",
    active: raw.active,
    sortOrder: raw.sortOrder,
  };
}
