export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

/** Raw shape returned by the API (Mongo doc with `_id`). */
export interface NoteRaw {
  _id: string;
  title: string;
  content?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toNoteDTO(raw: NoteRaw): NoteDTO {
  return {
    id: raw._id,
    title: raw.title,
    content: raw.content ?? "",
    pinned: raw.pinned,
    updatedAt: raw.updatedAt,
  };
}
