export interface DocumentItemDTO {
  id: string;
  title: string;
  url: string;
  category: string;
  createdAt: string;
}

/** Raw shape returned by the API (Mongo doc with `_id`). */
export interface DocumentItemRaw {
  _id: string;
  title: string;
  url: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function toDocumentItemDTO(raw: DocumentItemRaw): DocumentItemDTO {
  return {
    id: raw._id,
    title: raw.title,
    url: raw.url,
    category: raw.category,
    createdAt: raw.createdAt,
  };
}
