import {
  BookOpen,
  Bus,
  Clapperboard,
  Cloud,
  Code2,
  Dumbbell,
  GraduationCap,
  Music,
  Package,
  Palette,
  ShoppingBag,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/** A curated student offer/discount known to be available in India. Kept as static reference
 * content (not a live feed) — terms and eligibility change, so every card links out to the
 * brand's own page where the current details and verification flow live, and we tell the user
 * to confirm there. `verification` names how a student proves eligibility so nobody is surprised
 * mid-signup. */
export interface StudentOffer {
  id: string;
  brand: string;
  category: StudentOfferCategory;
  /** Short, scannable summary of the deal — the headline benefit, not marketing fluff. */
  offer: string;
  /** How the student proves they're a student to unlock it. */
  verification: string;
  url: string;
  icon: LucideIcon;
}

export const STUDENT_OFFER_CATEGORIES = [
  "Software & Learning",
  "Entertainment",
  "Food & Shopping",
  "Travel",
  "Fitness",
] as const;

export type StudentOfferCategory = (typeof STUDENT_OFFER_CATEGORIES)[number];

/** Icon shown on the category filter chips and section headings. */
export const CATEGORY_ICONS: Record<StudentOfferCategory, LucideIcon> = {
  "Software & Learning": Code2,
  Entertainment: Clapperboard,
  "Food & Shopping": ShoppingBag,
  Travel: Bus,
  Fitness: Dumbbell,
};

/** Well-known India-available student offers. Deliberately conservative: only long-running,
 * widely documented programs, each pointing at the official page so details stay accurate even
 * as specific percentages change. Not exhaustive and not an endorsement — the linked page is the
 * source of truth for current terms and eligibility. */
export const STUDENT_OFFERS: StudentOffer[] = [
  // Software & Learning
  {
    id: "github-student-pack",
    brand: "GitHub Student Developer Pack",
    category: "Software & Learning",
    offer: "Free access to 100+ developer tools, cloud credits, and domains while you study.",
    verification: "Verify with your school email or student ID",
    url: "https://education.github.com/pack",
    icon: Code2,
  },
  {
    id: "notion-education",
    brand: "Notion",
    category: "Software & Learning",
    offer: "Free Plus plan with unlimited AI for students and educators.",
    verification: "Sign up with a valid school email",
    url: "https://www.notion.so/product/notion-for-education",
    icon: BookOpen,
  },
  {
    id: "figma-education",
    brand: "Figma",
    category: "Software & Learning",
    offer: "Free Professional plan for students and educators.",
    verification: "Apply with proof of enrollment",
    url: "https://www.figma.com/education/",
    icon: Palette,
  },
  {
    id: "canva-education",
    brand: "Canva",
    category: "Software & Learning",
    offer: "Free Canva Pro features for eligible students.",
    verification: "Verify your student status via SheerID",
    url: "https://www.canva.com/students/",
    icon: Sparkles,
  },
  {
    id: "jetbrains-students",
    brand: "JetBrains",
    category: "Software & Learning",
    offer: "Free individual licences for all JetBrains IDEs (IntelliJ, PyCharm, etc.).",
    verification: "Apply with your university email or ISIC card",
    url: "https://www.jetbrains.com/community/education/#students",
    icon: Code2,
  },
  {
    id: "autodesk-education",
    brand: "Autodesk",
    category: "Software & Learning",
    offer: "Free AutoCAD, Fusion, Maya and more for students via the Education plan.",
    verification: "Confirm eligibility with student credentials",
    url: "https://www.autodesk.com/education/edu-software/overview",
    icon: Palette,
  },
  {
    id: "coursera-financial-aid",
    brand: "Coursera",
    category: "Software & Learning",
    offer: "Financial aid on individual courses so you can audit and get certificates free.",
    verification: "Apply for financial aid per course",
    url: "https://www.coursera.org/",
    icon: GraduationCap,
  },

  // Entertainment
  {
    id: "spotify-premium-student",
    brand: "Spotify Premium Student",
    category: "Entertainment",
    offer: "Discounted Premium plan for students, ad-free with offline listening.",
    verification: "Verify enrollment through SheerID",
    url: "https://www.spotify.com/in-en/student/",
    icon: Music,
  },
  {
    id: "youtube-premium-student",
    brand: "YouTube Premium Student",
    category: "Entertainment",
    offer: "Student-priced Premium — ad-free YouTube plus YouTube Music.",
    verification: "Verify student status annually via SheerID",
    url: "https://www.youtube.com/premium/student",
    icon: Clapperboard,
  },
  {
    id: "apple-music-student",
    brand: "Apple Music Student",
    category: "Entertainment",
    offer: "Discounted Apple Music for up to 48 months while enrolled.",
    verification: "Verify with UNiDAYS",
    url: "https://www.apple.com/in/apple-music/",
    icon: Music,
  },
  {
    id: "prime-student",
    brand: "Amazon Prime (Student pricing)",
    category: "Entertainment",
    offer: "Lower Prime pricing for students with the usual shopping and video perks.",
    verification: "Sign up with student details / valid ID",
    url: "https://www.amazon.in/joinstudent",
    icon: Package,
  },

  // Food & Shopping
  {
    id: "myntra-student",
    brand: "Myntra",
    category: "Food & Shopping",
    offer: "Student discount on fashion and lifestyle via verified student programs.",
    verification: "Verify student status at checkout",
    url: "https://www.myntra.com/",
    icon: ShoppingBag,
  },
  {
    id: "zomato-student",
    brand: "Zomato",
    category: "Food & Shopping",
    offer: "Frequent student-city offers and dining discounts around campuses.",
    verification: "Check in-app offers for your city",
    url: "https://www.zomato.com/",
    icon: Utensils,
  },
  {
    id: "unidays",
    brand: "UNiDAYS",
    category: "Food & Shopping",
    offer: "One membership unlocking hundreds of verified student discounts across brands.",
    verification: "Register free with your student email",
    url: "https://www.myunidays.com/IN/en-IN",
    icon: Sparkles,
  },
  {
    id: "isic-card",
    brand: "ISIC Card",
    category: "Food & Shopping",
    offer: "Internationally recognised student ID with discounts on shopping, travel and more.",
    verification: "Buy the card with proof of enrollment",
    url: "https://www.isic.org/",
    icon: GraduationCap,
  },

  // Travel
  {
    id: "irctc-concession",
    brand: "Indian Railways (IRCTC)",
    category: "Travel",
    offer: "Student concession on rail travel for eligible educational journeys.",
    verification: "Apply with a certificate from your institution",
    url: "https://www.irctc.co.in/",
    icon: Bus,
  },
  {
    id: "redbus-offers",
    brand: "redBus",
    category: "Travel",
    offer: "Regular student and first-trip bus booking offers.",
    verification: "Check current coupons in-app",
    url: "https://www.redbus.in/",
    icon: Bus,
  },

  // Fitness
  {
    id: "cultfit-student",
    brand: "cult.fit",
    category: "Fitness",
    offer: "Student-friendly membership pricing on gym and group classes.",
    verification: "Ask for student pricing at your centre / in-app",
    url: "https://www.cult.fit/",
    icon: Dumbbell,
  },
  {
    id: "microsoft-365-education",
    brand: "Microsoft 365 Education",
    category: "Software & Learning",
    offer: "Office apps free for students and teachers at eligible institutions.",
    verification: "Sign in with your school email",
    url: "https://www.microsoft.com/en-in/education/products/office",
    icon: Cloud,
  },
];
