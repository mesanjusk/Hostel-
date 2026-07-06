import type { ChecklistCategory, ChecklistPriority } from "@/types";

export interface ChecklistTemplateItem {
  category: ChecklistCategory;
  item: string;
  priority: ChecklistPriority;
  description?: string;
}

/**
 * Starter checklist seeded into every new student's account right after onboarding,
 * so they land on a pre-populated packing list instead of an empty one. Based on a
 * full NIFT hostel packing reference, organized into the app's 13 categories.
 */
export const DEFAULT_CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  // Documents
  { category: "Documents", item: "Admission Documents", priority: "high" },
  { category: "Documents", item: "ID Proof", priority: "high", description: "Aadhaar, etc." },
  {
    category: "Documents",
    item: "Passport-Size Photos",
    priority: "high",
    description: "10-15 copies",
  },
  { category: "Documents", item: "Fee Receipts", priority: "high" },
  { category: "Documents", item: "Hostel Allotment Papers", priority: "high" },
  { category: "Documents", item: "Medical Certificate", priority: "medium", description: "If required" },

  // Clothes
  { category: "Clothes", item: "T-Shirts / Tops", priority: "high", description: "Daily wear, 10-12" },
  { category: "Clothes", item: "Jeans / Pants", priority: "high", description: "4-5" },
  { category: "Clothes", item: "Shorts / Lowers", priority: "medium", description: "3-4" },
  { category: "Clothes", item: "Innerwear", priority: "high", description: "10-12 pairs" },
  { category: "Clothes", item: "Nightwear", priority: "medium", description: "3-4 sets" },
  {
    category: "Clothes",
    item: "Presentation Outfits",
    priority: "medium",
    description: "For presentations and college events",
  },
  {
    category: "Clothes",
    item: "Ethnic Wear",
    priority: "medium",
    description: "2-3 sets, required often at NIFT",
  },
  { category: "Clothes", item: "Jackets / Hoodies", priority: "medium", description: "2-3" },

  // Footwear
  { category: "Footwear", item: "Daily Sneakers", priority: "high" },
  { category: "Footwear", item: "Slippers", priority: "high", description: "Hostel use" },
  { category: "Footwear", item: "Formal Shoes", priority: "medium" },
  { category: "Footwear", item: "Ethnic Footwear", priority: "low" },

  // Toiletries
  { category: "Toiletries", item: "Toothbrush & Toothpaste", priority: "high" },
  { category: "Toiletries", item: "Face Wash", priority: "high" },
  { category: "Toiletries", item: "Soap / Body Wash", priority: "high" },
  { category: "Toiletries", item: "Shampoo & Conditioner", priority: "high" },
  { category: "Toiletries", item: "Hair Oil / Styling Products", priority: "low" },
  { category: "Toiletries", item: "Comb / Hairbrush", priority: "medium" },
  { category: "Toiletries", item: "Trimmer / Razor", priority: "medium" },
  { category: "Toiletries", item: "Towel", priority: "high", description: "2-3" },
  { category: "Toiletries", item: "Hand Towel", priority: "low" },
  { category: "Toiletries", item: "Nail Cutter", priority: "medium" },
  { category: "Toiletries", item: "Deodorant / Perfume", priority: "medium" },
  { category: "Toiletries", item: "Sanitary Products", priority: "high" },

  // Laundry
  { category: "Laundry", item: "Detergent (Powder/Liquid)", priority: "high" },
  {
    category: "Laundry",
    item: "Bucket + Mug",
    priority: "high",
    description: "Some hostels don't provide these",
  },
  { category: "Laundry", item: "Cloth Clips", priority: "medium" },
  {
    category: "Laundry",
    item: "Foldable Drying Stand",
    priority: "low",
    description: "Optional but useful",
  },
  { category: "Laundry", item: "Small Cleaning Brush", priority: "low", description: "For collars/shoes" },
  { category: "Laundry", item: "Room Cleaning Cloth", priority: "low" },
  { category: "Laundry", item: "Disinfectant Spray", priority: "medium" },
  {
    category: "Laundry",
    item: "Laundry Bag",
    priority: "medium",
    description: "Keep dirty clothes separate",
  },

  // Kitchen
  { category: "Kitchen", item: "Water Bottle", priority: "high", description: "1-2" },
  { category: "Kitchen", item: "Electric Kettle", priority: "high", description: "Very useful" },
  { category: "Kitchen", item: "Plate", priority: "medium" },
  { category: "Kitchen", item: "Bowl", priority: "medium" },
  { category: "Kitchen", item: "Spoon & Fork", priority: "medium" },
  { category: "Kitchen", item: "Mug", priority: "medium" },
  { category: "Kitchen", item: "Airtight Containers", priority: "low", description: "For snacks" },
  {
    category: "Kitchen",
    item: "Instant Food Stash",
    priority: "medium",
    description: "Maggi / ready-to-eat",
  },
  { category: "Kitchen", item: "Protein Snacks", priority: "low", description: "For busy days" },

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
  { category: "Electronics", item: "Laptop", priority: "high" },
  { category: "Electronics", item: "Laptop Charger", priority: "high" },
  {
    category: "Electronics",
    item: "Extension Board",
    priority: "high",
    description: "Crucial — limited sockets",
  },
  { category: "Electronics", item: "Power Bank", priority: "medium" },
  { category: "Electronics", item: "USB Drive / Hard Disk", priority: "medium" },
  { category: "Electronics", item: "Headphones / Earbuds", priority: "medium" },
  {
    category: "Electronics",
    item: "Table Lamp",
    priority: "medium",
    description: "Late-night work is normal at NIFT",
  },

  // Hostel Essentials
  { category: "Hostel Essentials", item: "Bedsheets", priority: "high", description: "3-4" },
  { category: "Hostel Essentials", item: "Pillow + Pillow Covers", priority: "high", description: "2-3" },
  {
    category: "Hostel Essentials",
    item: "Blanket / Comforter",
    priority: "high",
    description: "Depends on city climate",
  },
  {
    category: "Hostel Essentials",
    item: "Mattress Protector",
    priority: "high",
    description: "Very important for hygiene",
  },
  { category: "Hostel Essentials", item: "Lightweight Throw / Shawl", priority: "low" },
  { category: "Hostel Essentials", item: "Storage Boxes", priority: "medium" },
  { category: "Hostel Essentials", item: "Hangers", priority: "high", description: "10-15 minimum" },
  { category: "Hostel Essentials", item: "Adhesive Hooks", priority: "low" },
  { category: "Hostel Essentials", item: "Mirror", priority: "medium", description: "If not provided" },
  { category: "Hostel Essentials", item: "Bedside Organizer", priority: "medium" },
  { category: "Hostel Essentials", item: "Iron", priority: "low", description: "If allowed" },

  // Emergency
  { category: "Emergency", item: "Small Lock", priority: "high", description: "For cupboard" },
  { category: "Emergency", item: "Extra Lock", priority: "medium", description: "For suitcase" },
  { category: "Emergency", item: "First Aid Kit", priority: "high" },
  { category: "Emergency", item: "Band-Aids", priority: "medium" },

  // Medicines
  { category: "Medicines", item: "Paracetamol", priority: "high" },
  { category: "Medicines", item: "Cold/Cough Medicine", priority: "medium" },
  { category: "Medicines", item: "Digestion Tablets", priority: "medium" },
  { category: "Medicines", item: "ORS Packets", priority: "medium" },
  { category: "Medicines", item: "Personal Prescriptions", priority: "high" },

  // Miscellaneous
  { category: "Miscellaneous", item: "Earplugs", priority: "low", description: "Hostel noise is real" },
  { category: "Miscellaneous", item: "Eye Mask", priority: "low" },
  { category: "Miscellaneous", item: "Small Daily Backpack", priority: "medium" },
  { category: "Miscellaneous", item: "Umbrella", priority: "medium" },
  { category: "Miscellaneous", item: "Journal", priority: "low" },
];
