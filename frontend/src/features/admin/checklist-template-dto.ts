export interface ChecklistTemplateDTO {
  id: string;
  name: string;
  version: number;
  description: string;
  published: boolean;
  active: boolean;
}

export interface ChecklistTemplateRaw {
  _id: string;
  name: string;
  version: number;
  description?: string;
  published: boolean;
  active: boolean;
}

export function toChecklistTemplateDTO(raw: ChecklistTemplateRaw): ChecklistTemplateDTO {
  return {
    id: raw._id,
    name: raw.name,
    version: raw.version,
    description: raw.description ?? "",
    published: raw.published,
    active: raw.active,
  };
}
