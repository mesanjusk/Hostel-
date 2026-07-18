export type UserRole = "student" | "admin";

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

/** Checklist items default to "All" (unisex) but can be targeted at a specific gender, e.g.
 * sanitary items for Female or grooming items for Male. */
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
  mobile: string;
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
 * time (book a ticket, arrange a SIM card, etc). Unset (null) until the user classifies it. */
export const PLAN_TYPES = ["pack", "plan"] as const;
export type ChecklistPlanType = (typeof PLAN_TYPES)[number];

/** Best-effort mapping from an admin-created CollegeCategory name to the legacy fixed enum,
 * so old code paths (categoryService's Designing-only folder, admin filters) keep working for
 * new signups too. Anything unmatched falls back to "Other", mirroring the legacy semantics. */
export const LEGACY_COLLEGE_CATEGORY_MAP: Record<string, CollegeCategory> = {
  design: "Designing",
  designing: "Designing",
  engineering: "Engineering",
  medical: "Medical",
  commerce: "Commerce",
  arts: "Arts",
};

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

export const DISCOVERY_CONTEXTS = ["co_packer", "roommate"] as const;
export type DiscoveryContext = (typeof DISCOVERY_CONTEXTS)[number];

export const CONNECTION_STATUSES = ["pending", "accepted", "declined"] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

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

export const BOOKING_CATEGORIES = ["travel", "stay"] as const;
export type BookingCategoryType = (typeof BOOKING_CATEGORIES)[number];

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

/** Know Your Campus tip categories — deliberately broader strokes than PLACE_CATEGORIES,
 * since a tip is a student's one-liner ("the photocopy shop behind gate 2 binds theses
 * overnight"), not a catalogued venue. */
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

/** Auto-join scoped types are derived straight from a student's own profile fields (college,
 * city, courseId, etc) — nothing here is hardcoded to any one institution, so any Indian
 * college/course/city works the moment a student's profile names it. */
export const COMMUNITY_TYPES = [
  "country",
  "city",
  "college",
  "campus",
  "course",
  "year",
  "hostel",
  "interest",
  "marketplace",
  "events",
  "lost_found",
  "general",
  "announcements",
  "custom",
] as const;
export type CommunityType = (typeof COMMUNITY_TYPES)[number];

export const COMMUNITY_VISIBILITY = ["public", "private", "invite_only"] as const;
export type CommunityVisibility = (typeof COMMUNITY_VISIBILITY)[number];

export const COMMUNITY_ROLES = ["owner", "admin", "moderator", "verified", "member", "guest"] as const;
export type CommunityRole = (typeof COMMUNITY_ROLES)[number];

/** "pending" communities were auto-created for a city/college/campus/course that had no
 * community yet — they're joinable by the student who triggered the auto-create, but hidden
 * from discovery for everyone else until a site admin approves them. "suspended" is a site-admin
 * action on a misbehaving community, distinct from a hard delete (see Community.active). */
export const COMMUNITY_STATUS = ["pending", "approved", "suspended"] as const;
export type CommunityStatus = (typeof COMMUNITY_STATUS)[number];

export const CHANNEL_TYPES = ["text", "announcement"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const ATTACHMENT_TYPES = ["image", "video", "audio", "document"] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export const MESSAGE_SCOPE_TYPES = ["channel", "conversation"] as const;
export type MessageScopeType = (typeof MESSAGE_SCOPE_TYPES)[number];

export const CONVERSATION_TYPES = ["dm", "group"] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const REPORT_TARGET_TYPES = ["message", "user", "community", "campus_tip"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

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

export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface PublicUserDTO {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  college: string | null;
  campus: string | null;
  course: string | null;
  year: string | null;
  city: string | null;
  bio: string | null;
  interests: string[];
  verified: boolean;
}
