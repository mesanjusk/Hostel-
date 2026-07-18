import type { ChecklistCategory, ChecklistGender, ChecklistPlanType, ChecklistPriority } from "@/types";

export interface ChecklistTemplateItem {
  category: ChecklistCategory;
  item: string;
  priority: ChecklistPriority;
  /** Pack it / Plan it classification — omitted where the source list left it unclassified,
   * so the item seeds with planType null and the user picks pack or plan themselves. */
  planType?: ChecklistPlanType;
  description?: string;
  /** Omitted means "All" (unisex) — the vast majority of items. Only set this for something
   * clearly and exclusively for one gender (e.g. sanitary products, a razor/trimmer); anything
   * ambiguous (ethnic wear, styling products, jewelry-adjacent accessories) is deliberately left
   * unisex rather than guessed at. See scripts/retagChecklistGender.ts for how this reaches
   * already-seeded production documents. */
  gender?: ChecklistGender;
}

/**
 * Starter checklist seeded into every new student's account right after onboarding,
 * so they land on a pre-populated packing list instead of an empty one. Based on a
 * full NIFT hostel packing reference, organized into the app's 13 categories.
 */
export const DEFAULT_CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  // Documents
  { category: "Documents", item: "Admission Documents", priority: "high", planType: "pack" },
  { category: "Documents", item: "ID Proof", priority: "high", planType: "pack", description: "Aadhaar, etc." },
  {
    category: "Documents",
    item: "Passport-Size Photos",
    priority: "high",
    planType: "pack",
    description: "10-15 copies",
  },
  { category: "Documents", item: "Fee Receipts", priority: "high", planType: "pack" },
  { category: "Documents", item: "Hostel Allotment Papers", priority: "high", planType: "pack" },
  { category: "Documents", item: "Medical Certificate", priority: "medium", planType: "pack", description: "If required" },

  // Clothes
  { category: "Clothes", item: "T-Shirts / Tops", priority: "high", planType: "pack", description: "Daily wear, 10-12" },
  { category: "Clothes", item: "Jeans / Pants", priority: "high", planType: "pack", description: "4-5" },
  { category: "Clothes", item: "Shorts / Lowers", priority: "medium", planType: "pack", description: "3-4" },
  { category: "Clothes", item: "Innerwear", priority: "high", planType: "pack", description: "10-12 pairs" },
  { category: "Clothes", item: "Nightwear", priority: "medium", planType: "pack", description: "3-4 sets" },
  {
    category: "Clothes",
    item: "Presentation Outfits",
    priority: "medium",
    planType: "pack",
    description: "For presentations and college events",
  },
  {
    category: "Clothes",
    item: "Ethnic Wear",
    priority: "medium",
    planType: "pack",
    description: "2-3 sets, required often at NIFT",
  },
  { category: "Clothes", item: "Jackets / Hoodies", priority: "medium", planType: "pack", description: "2-3" },

  // Footwear
  { category: "Footwear", item: "Daily Sneakers", priority: "high", planType: "plan" },
  { category: "Footwear", item: "Slippers", priority: "high", description: "Hostel use" },
  { category: "Footwear", item: "Formal Shoes", priority: "medium" },
  { category: "Footwear", item: "Ethnic Footwear", priority: "low" },

  // Toiletries
  { category: "Toiletries", item: "Toothbrush & Toothpaste", priority: "high", planType: "pack" },
  { category: "Toiletries", item: "Face Wash", priority: "high", planType: "pack" },
  { category: "Toiletries", item: "Soap / Body Wash", priority: "high", planType: "pack" },
  { category: "Toiletries", item: "Shampoo & Conditioner", priority: "high", planType: "pack" },
  { category: "Toiletries", item: "Hair Oil / Styling Products", priority: "low", planType: "pack" },
  { category: "Toiletries", item: "Comb / Hairbrush", priority: "medium", planType: "pack" },
  { category: "Toiletries", item: "Trimmer / Razor", priority: "medium", planType: "pack", gender: "Male" },
  { category: "Toiletries", item: "Towel", priority: "high", planType: "pack", description: "2-3" },
  { category: "Toiletries", item: "Hand Towel", priority: "low", planType: "pack" },
  { category: "Toiletries", item: "Nail Cutter", priority: "medium", planType: "pack" },
  { category: "Toiletries", item: "Deodorant / Perfume", priority: "medium", planType: "pack" },
  { category: "Toiletries", item: "Sanitary Products", priority: "high", planType: "pack", gender: "Female" },

  // Laundry
  { category: "Laundry", item: "Detergent (Powder/Liquid)", priority: "high", planType: "plan" },
  {
    category: "Laundry",
    item: "Bucket + Mug",
    priority: "high",
    planType: "plan",
    description: "Some hostels don't provide these",
  },
  { category: "Laundry", item: "Cloth Clips", priority: "medium", planType: "plan" },
  {
    category: "Laundry",
    item: "Foldable Drying Stand",
    priority: "low",
    planType: "plan",
    description: "Optional but useful",
  },
  { category: "Laundry", item: "Small Cleaning Brush", priority: "low", planType: "plan", description: "For collars/shoes" },
  { category: "Laundry", item: "Room Cleaning Cloth", priority: "low", planType: "plan" },
  { category: "Laundry", item: "Disinfectant Spray", priority: "medium", planType: "plan" },
  {
    category: "Laundry",
    item: "Laundry Bag",
    priority: "medium",
    planType: "plan",
    description: "Keep dirty clothes separate",
  },

  // Kitchen
  { category: "Kitchen", item: "Water Bottle", priority: "high", planType: "pack", description: "1-2" },
  { category: "Kitchen", item: "Electric Kettle", priority: "high", description: "Very useful" },
  { category: "Kitchen", item: "Plate", priority: "medium", planType: "pack" },
  { category: "Kitchen", item: "Bowl", priority: "medium", planType: "pack" },
  { category: "Kitchen", item: "Spoon & Fork", priority: "medium", planType: "pack" },
  { category: "Kitchen", item: "Mug", priority: "medium", planType: "pack" },
  { category: "Kitchen", item: "Airtight Containers", priority: "low", planType: "plan", description: "For snacks" },
  {
    category: "Kitchen",
    item: "Instant Food Stash",
    priority: "medium",
    planType: "plan",
    description: "Maggi / ready-to-eat",
  },
  { category: "Kitchen", item: "Protein Snacks", priority: "low", planType: "plan", description: "For busy days" },

  // Stationery
  { category: "Stationery", item: "Pencils (HB, 2B, 4B, 6B)", priority: "high" },
  { category: "Stationery", item: "Eraser & Sharpener", priority: "high" },
  { category: "Stationery", item: "Black Fineliner Pens", priority: "medium" },
  { category: "Stationery", item: "Scale", priority: "medium" },
  { category: "Stationery", item: "Cutter & Scissors", priority: "medium" },
  { category: "Stationery", item: "Glue / Fevicol", priority: "medium" },

  // Fashion Design Tools
  { category: "Fashion Design Tools", item: "Sketchbooks (A3 + A4)", priority: "high" },
  { category: "Fashion Design Tools", item: "Drawing Sheets", priority: "high" },
  { category: "Fashion Design Tools", item: "Color Pencils", priority: "medium" },
  { category: "Fashion Design Tools", item: "Poster Colors / Watercolor", priority: "medium" },
  { category: "Fashion Design Tools", item: "Brushes", priority: "medium" },
  {
    category: "Fashion Design Tools",
    item: "Cutting Mat",
    priority: "low",
    description: "Optional but a pro move",
  },
  { category: "Fashion Design Tools", item: "Submission Folder", priority: "high" },
  { category: "Fashion Design Tools", item: "Portfolio File", priority: "high" },
  {
    category: "Fashion Design Tools",
    item: "Sewing Kit",
    priority: "high",
    description: "Very useful in fashion college",
  },
  { category: "Fashion Design Tools", item: "Fabric Scraps", priority: "low", description: "For practice" },
  { category: "Fashion Design Tools", item: "Measuring Tape", priority: "medium" },

  // Electronics
  { category: "Electronics", item: "Laptop", priority: "high", planType: "pack" },
  { category: "Electronics", item: "Laptop Charger", priority: "high", planType: "pack" },
  {
    category: "Electronics",
    item: "Extension Board",
    priority: "high",
    planType: "pack",
    description: "Crucial — limited sockets",
  },
  { category: "Electronics", item: "Power Bank", priority: "medium", planType: "pack" },
  { category: "Electronics", item: "USB Drive / Hard Disk", priority: "medium", planType: "pack" },
  { category: "Electronics", item: "Headphones / Earbuds", priority: "medium", planType: "pack" },
  {
    category: "Electronics",
    item: "Table Lamp",
    priority: "medium",
    description: "Late-night work is normal at NIFT",
  },

  // Hostel Essentials
  { category: "Hostel Essentials", item: "Bedsheets", priority: "high", planType: "plan", description: "3-4" },
  { category: "Hostel Essentials", item: "Pillow + Pillow Covers", priority: "high", planType: "plan", description: "2-3" },
  {
    category: "Hostel Essentials",
    item: "Blanket / Comforter",
    priority: "high",
    planType: "plan",
    description: "Depends on city climate",
  },
  {
    category: "Hostel Essentials",
    item: "Mattress Protector",
    priority: "high",
    description: "Very important for hygiene",
  },
  { category: "Hostel Essentials", item: "Lightweight Throw / Shawl", priority: "low" },
  { category: "Hostel Essentials", item: "Storage Boxes", priority: "medium", planType: "plan" },
  { category: "Hostel Essentials", item: "Hangers", priority: "high", planType: "plan", description: "10-15 minimum" },
  { category: "Hostel Essentials", item: "Adhesive Hooks", priority: "low", planType: "plan" },
  { category: "Hostel Essentials", item: "Mirror", priority: "medium", planType: "plan", description: "If not provided" },
  { category: "Hostel Essentials", item: "Bedside Organizer", priority: "medium", planType: "plan" },
  { category: "Hostel Essentials", item: "Iron", priority: "low", description: "If allowed" },

  // Emergency
  { category: "Emergency", item: "Small Lock", priority: "high", description: "For cupboard" },
  { category: "Emergency", item: "Extra Lock", priority: "medium", description: "For suitcase" },
  { category: "Emergency", item: "First Aid Kit", priority: "high" },
  { category: "Emergency", item: "Band-Aids", priority: "medium" },

  // Medicines
  { category: "Medicines", item: "Paracetamol", priority: "high", planType: "pack" },
  { category: "Medicines", item: "Cold/Cough Medicine", priority: "medium", planType: "pack" },
  { category: "Medicines", item: "Digestion Tablets", priority: "medium", planType: "pack" },
  { category: "Medicines", item: "ORS Packets", priority: "medium", planType: "pack" },
  { category: "Medicines", item: "Personal Prescriptions", priority: "high", planType: "pack" },

  // Hobbies
  { category: "Hobbies", item: "Earphones / Bluetooth Speaker", priority: "medium", planType: "pack", description: "For music on the go" },
  { category: "Hobbies", item: "Musical Instrument", priority: "low", planType: "pack", description: "Guitar, keyboard, etc. — if you play" },
  { category: "Hobbies", item: "Books / Novels", priority: "medium", planType: "pack", description: "A couple of favorites for downtime" },
  { category: "Hobbies", item: "E-Reader / Reading Light", priority: "low", planType: "pack" },
  { category: "Hobbies", item: "Sports Kit", priority: "medium", planType: "pack", description: "Shoes, jersey, or gear for your sport" },
  { category: "Hobbies", item: "Yoga Mat", priority: "low", planType: "pack" },
  { category: "Hobbies", item: "Sketchbook & Drawing Supplies", priority: "medium", planType: "pack" },
  { category: "Hobbies", item: "Paints / Colors", priority: "low", planType: "pack" },
  { category: "Hobbies", item: "Handheld Console / Controller", priority: "low", planType: "pack" },
  { category: "Hobbies", item: "Playing Cards / Board Game", priority: "low", planType: "pack", description: "Great for hostel downtime" },
  { category: "Hobbies", item: "Compact Travel Backpack", priority: "medium", planType: "plan" },
  { category: "Hobbies", item: "Travel Journal / Guidebook", priority: "low", planType: "pack" },
  { category: "Hobbies", item: "Resistance Bands / Skipping Rope", priority: "medium", planType: "pack" },
  { category: "Hobbies", item: "Gym Shoes / Sportswear", priority: "medium", planType: "plan" },
  { category: "Hobbies", item: "Recipe Book / Baking Tools", priority: "low", planType: "plan", description: "For dorm-friendly cooking experiments" },
  { category: "Hobbies", item: "Camera / Phone Tripod", priority: "medium", planType: "pack" },
  { category: "Hobbies", item: "Memory Cards & Camera Bag", priority: "low", planType: "pack" },
  { category: "Hobbies", item: "Tablet / Laptop Stand", priority: "low", planType: "plan", description: "For movie nights in your room" },
  { category: "Hobbies", item: "Portable Hard Drive", priority: "low", planType: "plan", description: "Offline movies & shows for low-data days" },

  // Miscellaneous
  { category: "Miscellaneous", item: "Earplugs", priority: "low", description: "Hostel noise is real" },
  { category: "Miscellaneous", item: "Eye Mask", priority: "low" },
  { category: "Miscellaneous", item: "Small Daily Backpack", priority: "medium" },
  { category: "Miscellaneous", item: "Umbrella", priority: "medium" },
  { category: "Miscellaneous", item: "Journal", priority: "low" },
];
