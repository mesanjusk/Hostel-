import type { CampusTipCategory } from "@/types";

export interface CampusTipDTO {
  id: string;
  city: string;
  college: string;
  category: CampusTipCategory;
  text: string;
  linkUrl: string | null;
  imageUrl: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  upvotes: number;
  downvotes: number;
  myVote: "up" | "down" | null;
  isMine: boolean;
  createdAt: string;
}

export interface CampusTipRaw {
  _id: string;
  city: string;
  college: string;
  category: CampusTipCategory;
  text: string;
  linkUrl?: string | null;
  imageUrl?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  upvotes?: number;
  downvotes?: number;
  myVote?: "up" | "down" | null;
  isMine?: boolean;
  createdAt: string;
}

export function toCampusTipDTO(raw: CampusTipRaw): CampusTipDTO {
  return {
    id: raw._id,
    city: raw.city,
    college: raw.college,
    category: raw.category,
    text: raw.text,
    linkUrl: raw.linkUrl ?? null,
    imageUrl: raw.imageUrl ?? null,
    authorName: raw.authorName ?? null,
    authorAvatar: raw.authorAvatar ?? null,
    upvotes: raw.upvotes ?? 0,
    downvotes: raw.downvotes ?? 0,
    myVote: raw.myVote ?? null,
    isMine: raw.isMine ?? false,
    createdAt: raw.createdAt,
  };
}
