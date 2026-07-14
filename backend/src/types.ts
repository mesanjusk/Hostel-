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
  role: UserRole;
  theme: "light" | "dark" | "system";
  needsOnboarding: boolean;
  verified: boolean;
  createdAt: string;
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
  "Miscellaneous",
] as const;

export type ProductCategory = (typeof DEFAULT_CHECKLIST_CATEGORIES)[number];
export type ChecklistCategory = string;

export const CHECKLIST_PRIORITIES = ["low", "medium", "high"] as const;
export type ChecklistPriority = (typeof CHECKLIST_PRIORITIES)[number];

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
