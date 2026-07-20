export type UserRole = "student" | "admin";

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

/** Checklist items default to "All" (unisex) but can be targeted at a specific gender. */
export const CHECKLIST_GENDER_OPTIONS = ["All", ...GENDER_OPTIONS] as const;
export type ChecklistGender = (typeof CHECKLIST_GENDER_OPTIONS)[number];

export const COLLEGE_CATEGORY_OPTIONS = [
  "Designing",
  "Engineering",
  "Medical",
  "Commerce",
  "Arts",
  "Other",
] as const;
export type CollegeCategory = (typeof COLLEGE_CATEGORY_OPTIONS)[number];

export interface UserDTO {
  id: string;
  name: string | null;
  /** Null until this visitor links a mobile number (or an admin doesn't set one) — see
   * backend User model's `mobile` field. */
  mobile: string | null;
  avatar: string | null;
  gender: Gender | null;
  college: string | null;
  collegeCategory: CollegeCategory | null;
  collegeCategoryId: string | null;
  courseId: string | null;
  city: string | null;
  homeTown: string | null;
  role: UserRole;
  theme: "light" | "dark" | "system";
  needsOnboarding: boolean;
  verified: boolean;
  createdAt: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  interests: string[];
  campus: string | null;
  year: string | null;
  communityProfileConfigured: boolean;
  waBroadcastEnabled: boolean;
  waWindowOpenedAt: string | null;
}

export const DEFAULT_CHECKLIST_CATEGORIES = [
  "Documents",
  "Clothes",
  "Footwear",
  "Electronics",
  "Medicines",
  "Toiletries",
  "Laundry",
  "Stationery",
  "Kitchen",
  "Hostel Essentials",
  "Fashion Design Tools",
  "Emergency",
  "Hobbies",
  "Miscellaneous",
] as const;

export type ProductCategory = (typeof DEFAULT_CHECKLIST_CATEGORIES)[number];
export type ChecklistCategory = string;

export const CHECKLIST_PRIORITIES = ["low", "medium", "high"] as const;
export type ChecklistPriority = (typeof CHECKLIST_PRIORITIES)[number];

/** Whether an item is something you physically pack, or something to plan/prepare ahead of
 * time. Unset (null) until the user classifies it. */
export const PLAN_TYPES = ["pack", "plan"] as const;
export type ChecklistPlanType = (typeof PLAN_TYPES)[number];

export const BUDGET_ENTRY_TYPES = ["planned", "expense"] as const;
export type BudgetEntryType = (typeof BUDGET_ENTRY_TYPES)[number];

export const BUDGET_CATEGORIES = [
  "Clothing",
  "Electronics",
  "Food",
  "Toiletries",
  "Stationery",
  "Travel",
  "Medical",
  "Rent",
  "Miscellaneous",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const STORE_OPTIONS = ["Amazon", "Flipkart", "Myntra", "Decathlon", "Local Store"] as const;
export type StoreOption = (typeof STORE_OPTIONS)[number];

/** Preset pastel colors offered in the bag color picker (Gen-Z-friendly palette). */
export const BAG_COLOR_PRESETS = [
  "#7C9CF2",
  "#F27C9C",
  "#7CE0C0",
  "#F2C97C",
  "#B57CF2",
  "#F29C7C",
  "#7CD1F2",
  "#9AA5B1",
] as const;

export const GUIDE_CATEGORIES = [
  "Packing",
  "Laundry",
  "Etiquette",
  "Safety",
  "Women Safety",
  "Medical",
  "Documents",
  "Emergency",
  "First Week",
  "Budget Planning",
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

// --- Discovery / Booking / Places -------------------------------------------------------

export const ACCOMMODATION_TYPES = ["Hostel", "PG", "Flat", "Apartment", "Hotel"] as const;
export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

/** The three listing types shown in the "Hostel, PG, Flat" browse feature — narrower than
 * ACCOMMODATION_TYPES (which also covers Apartment/Hotel for a student's own Booking record). */
export const LISTING_TYPES = ["Hostel", "PG", "Flat"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const CONTACT_CATEGORIES = [
  "Friend",
  "Senior",
  "Classmate",
  "Alumni",
  "Relative",
  "Emergency Contact",
  "Verified Local Volunteer",
  "Useful Shop",
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const TRAVEL_TYPES = ["Train", "Flight", "Bus", "Cab"] as const;
export type TravelType = (typeof TRAVEL_TYPES)[number];

export const BOOKING_STATUSES = ["upcoming", "completed", "missed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PLACE_CATEGORIES = [
  "Tourist Place",
  "Restaurant",
  "Street Food",
  "Shopping",
  "Medical",
  "Station",
  "Airport",
  "Bank",
  "ATM",
  "Laundry",
  "Gym",
  "Library",
  "Cafe",
  "Temple",
  "Mosque",
  "Church",
  "Park",
  "Market",
  "Nearby Attraction",
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

/** Know Your Campus tip categories — mirrors backend/src/types.ts. */
export const CAMPUS_TIP_CATEGORIES = [
  "Food",
  "Hangouts",
  "Books & Stationery",
  "Transport",
  "Shops & Services",
  "Hostel Life",
  "Academics",
  "Other",
] as const;
export type CampusTipCategory = (typeof CAMPUS_TIP_CATEGORIES)[number];

// --- Community + Chat ------------------------------------------------------------------

export type CommunityType =
  | "country"
  | "city"
  | "college"
  | "campus"
  | "course"
  | "year"
  | "hostel"
  | "interest"
  | "marketplace"
  | "events"
  | "lost_found"
  | "general"
  | "announcements"
  | "custom";

export type CommunityVisibility = "public" | "private" | "invite_only";
export type CommunityRole = "owner" | "admin" | "moderator" | "verified" | "member" | "guest";
export type CommunityStatus = "pending" | "approved" | "suspended";
export type MessageScopeType = "channel" | "conversation";
export type AttachmentType = "image" | "video" | "audio" | "document";

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "nudity",
  "violence",
  "scam",
  "misinformation",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface PublicUserDTO {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  college: string | null;
  campus: string | null;
  city: string | null;
  bio: string;
  interests: string[];
  verified: boolean;
}

export interface CommunityDTO {
  _id: string;
  name: string;
  slug: string;
  type: CommunityType;
  description: string;
  icon: string | null;
  visibility: CommunityVisibility;
  isOfficial: boolean;
  allowAnonymous: boolean;
  memberCount: number;
  status?: CommunityStatus;
  active?: boolean;
  createdAt?: string;
  myRole?: CommunityRole;
  joined?: boolean;
}

export interface ChannelDTO {
  _id: string;
  communityId: string;
  name: string;
  slug: string;
  type: "text" | "announcement";
  topic: string;
  isDefault: boolean;
  allowAnonymous: boolean;
}

export interface MessageAttachmentDTO {
  type: AttachmentType;
  url: string;
  name?: string;
  size?: number | null;
  mimeType?: string | null;
}

export interface MessageReactionDTO {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface MessageDTO {
  id: string;
  scopeType: MessageScopeType;
  scopeId: string;
  author: PublicUserDTO | null;
  anonymousAlias: string | null;
  body: string;
  attachments: MessageAttachmentDTO[];
  mentions: string[];
  parentMessageId: string | null;
  edited: boolean;
  pinned: boolean;
  reactions: MessageReactionDTO[];
  deleted: boolean;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  type: "dm" | "group";
  name: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  members: PublicUserDTO[];
}
