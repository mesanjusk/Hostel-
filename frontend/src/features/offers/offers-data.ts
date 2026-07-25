import {
  Banknote,
  BookOpen,
  Bus,
  Clapperboard,
  Cloud,
  Code2,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Landmark,
  LineChart,
  Music,
  Package,
  Palette,
  Presentation,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Utensils,
  Wallet,
  Building,
  type LucideIcon,
} from "lucide-react";

/** Which audience an offer set is for. A student and a working professional see different,
 * relevant catalogs on the same page — the page defaults to the viewer's occupation but lets
 * either browse the other (see offers-view.tsx). */
export type Audience = "student" | "professional";

/** A curated offer/perk known to be available in India. Kept as static reference content (not a
 * live feed) — terms and eligibility change, so every card links out to the brand's own page
 * where the current details and sign-up flow live, and we tell the user to confirm there.
 * `access` names how you unlock it (student verification, a free trial, a sign-up) so nobody is
 * surprised mid-signup. */
export interface Offer {
  id: string;
  brand: string;
  category: string;
  /** Short, scannable summary of the deal — the headline benefit, not marketing fluff. */
  offer: string;
  /** How you get it: student verification, a free trial, a plain sign-up, etc. */
  access: string;
  url: string;
  icon: LucideIcon;
}

/** Shared icon lookup for the category filter chips across both audiences. Every category label
 * used in either catalog below must have an entry here. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Student categories
  "Software & Learning": Code2,
  Entertainment: Clapperboard,
  "Food & Shopping": ShoppingBag,
  Travel: Bus,
  Fitness: Dumbbell,
  // Professional categories
  "Learning & Upskilling": Presentation,
  "Software & Tools": Cloud,
  "Workspace": Building,
  "Finance & Taxes": Landmark,
  "Health & Wellness": HeartPulse,
};

/** Well-known India-available student offers. Deliberately conservative: only long-running,
 * widely documented programs, each pointing at the official page so details stay accurate even
 * as specific percentages change. Not exhaustive and not an endorsement — the linked page is the
 * source of truth for current terms and eligibility. */
const STUDENT_OFFERS: Offer[] = [
  // Software & Learning
  {
    id: "github-student-pack",
    brand: "GitHub Student Developer Pack",
    category: "Software & Learning",
    offer: "Free access to 100+ developer tools, cloud credits, and domains while you study.",
    access: "Verify with your school email or student ID",
    url: "https://education.github.com/pack",
    icon: Code2,
  },
  {
    id: "notion-education",
    brand: "Notion",
    category: "Software & Learning",
    offer: "Free Plus plan with unlimited AI for students and educators.",
    access: "Sign up with a valid school email",
    url: "https://www.notion.so/product/notion-for-education",
    icon: BookOpen,
  },
  {
    id: "figma-education",
    brand: "Figma",
    category: "Software & Learning",
    offer: "Free Professional plan for students and educators.",
    access: "Apply with proof of enrollment",
    url: "https://www.figma.com/education/",
    icon: Palette,
  },
  {
    id: "canva-education",
    brand: "Canva",
    category: "Software & Learning",
    offer: "Free Canva Pro features for eligible students.",
    access: "Verify your student status via SheerID",
    url: "https://www.canva.com/students/",
    icon: Sparkles,
  },
  {
    id: "jetbrains-students",
    brand: "JetBrains",
    category: "Software & Learning",
    offer: "Free individual licences for all JetBrains IDEs (IntelliJ, PyCharm, etc.).",
    access: "Apply with your university email or ISIC card",
    url: "https://www.jetbrains.com/community/education/#students",
    icon: Code2,
  },
  {
    id: "autodesk-education",
    brand: "Autodesk",
    category: "Software & Learning",
    offer: "Free AutoCAD, Fusion, Maya and more for students via the Education plan.",
    access: "Confirm eligibility with student credentials",
    url: "https://www.autodesk.com/education/edu-software/overview",
    icon: Palette,
  },
  {
    id: "coursera-financial-aid",
    brand: "Coursera",
    category: "Software & Learning",
    offer: "Financial aid on individual courses so you can audit and get certificates free.",
    access: "Apply for financial aid per course",
    url: "https://www.coursera.org/",
    icon: GraduationCap,
  },
  {
    id: "microsoft-365-education",
    brand: "Microsoft 365 Education",
    category: "Software & Learning",
    offer: "Office apps free for students and teachers at eligible institutions.",
    access: "Sign in with your school email",
    url: "https://www.microsoft.com/en-in/education/products/office",
    icon: Cloud,
  },

  // Entertainment
  {
    id: "spotify-premium-student",
    brand: "Spotify Premium Student",
    category: "Entertainment",
    offer: "Discounted Premium plan for students, ad-free with offline listening.",
    access: "Verify enrollment through SheerID",
    url: "https://www.spotify.com/in-en/student/",
    icon: Music,
  },
  {
    id: "youtube-premium-student",
    brand: "YouTube Premium Student",
    category: "Entertainment",
    offer: "Student-priced Premium — ad-free YouTube plus YouTube Music.",
    access: "Verify student status annually via SheerID",
    url: "https://www.youtube.com/premium/student",
    icon: Clapperboard,
  },
  {
    id: "apple-music-student",
    brand: "Apple Music Student",
    category: "Entertainment",
    offer: "Discounted Apple Music for up to 48 months while enrolled.",
    access: "Verify with UNiDAYS",
    url: "https://www.apple.com/in/apple-music/",
    icon: Music,
  },
  {
    id: "prime-student",
    brand: "Amazon Prime (Student pricing)",
    category: "Entertainment",
    offer: "Lower Prime pricing for students with the usual shopping and video perks.",
    access: "Sign up with student details / valid ID",
    url: "https://www.amazon.in/joinstudent",
    icon: Package,
  },

  // Food & Shopping
  {
    id: "myntra-student",
    brand: "Myntra",
    category: "Food & Shopping",
    offer: "Student discount on fashion and lifestyle via verified student programs.",
    access: "Verify student status at checkout",
    url: "https://www.myntra.com/",
    icon: ShoppingBag,
  },
  {
    id: "zomato-student",
    brand: "Zomato",
    category: "Food & Shopping",
    offer: "Frequent student-city offers and dining discounts around campuses.",
    access: "Check in-app offers for your city",
    url: "https://www.zomato.com/",
    icon: Utensils,
  },
  {
    id: "unidays",
    brand: "UNiDAYS",
    category: "Food & Shopping",
    offer: "One membership unlocking hundreds of verified student discounts across brands.",
    access: "Register free with your student email",
    url: "https://www.myunidays.com/IN/en-IN",
    icon: Sparkles,
  },
  {
    id: "isic-card",
    brand: "ISIC Card",
    category: "Food & Shopping",
    offer: "Internationally recognised student ID with discounts on shopping, travel and more.",
    access: "Buy the card with proof of enrollment",
    url: "https://www.isic.org/",
    icon: GraduationCap,
  },

  // Travel
  {
    id: "irctc-concession",
    brand: "Indian Railways (IRCTC)",
    category: "Travel",
    offer: "Student concession on rail travel for eligible educational journeys.",
    access: "Apply with a certificate from your institution",
    url: "https://www.irctc.co.in/",
    icon: Bus,
  },
  {
    id: "redbus-offers",
    brand: "redBus",
    category: "Travel",
    offer: "Regular student and first-trip bus booking offers.",
    access: "Check current coupons in-app",
    url: "https://www.redbus.in/",
    icon: Bus,
  },

  // Fitness
  {
    id: "cultfit-student",
    brand: "cult.fit",
    category: "Fitness",
    offer: "Student-friendly membership pricing on gym and group classes.",
    access: "Ask for student pricing at your centre / in-app",
    url: "https://www.cult.fit/",
    icon: Dumbbell,
  },
];

/** Perks and services useful to a working professional in India. Same conservative bar as the
 * student set — well-known, long-running programs, each linking to its official page as the
 * source of truth. These are a mix of free tiers, free trials and low-cost professional services
 * rather than student-verified discounts, so `access` describes the sign-up path instead. Not
 * exhaustive and not an endorsement. */
const PROFESSIONAL_PERKS: Offer[] = [
  // Learning & Upskilling
  {
    id: "linkedin-learning",
    brand: "LinkedIn Learning",
    category: "Learning & Upskilling",
    offer: "Thousands of expert-led courses with completion certificates on your profile.",
    access: "Start the 1-month free trial with your account",
    url: "https://www.linkedin.com/learning/",
    icon: Presentation,
  },
  {
    id: "coursera-plus",
    brand: "Coursera Plus",
    category: "Learning & Upskilling",
    offer: "Unlimited access to 7,000+ courses and professional certificates.",
    access: "Subscribe monthly or annually; 7-day refund window",
    url: "https://www.coursera.org/courseraplus",
    icon: GraduationCap,
  },
  {
    id: "google-career-certificates",
    brand: "Google Career Certificates",
    category: "Learning & Upskilling",
    offer: "Job-ready certificates in data, UX, IT and PM — no degree required.",
    access: "Enrol on Coursera; financial support available",
    url: "https://grow.google/certificates/",
    icon: BookOpen,
  },
  {
    id: "oreilly-learning",
    brand: "O'Reilly Learning",
    category: "Learning & Upskilling",
    offer: "Tech books, videos and live courses — often free through your employer.",
    access: "Check employer access or start a free trial",
    url: "https://www.oreilly.com/",
    icon: BookOpen,
  },

  // Software & Tools
  {
    id: "github-free",
    brand: "GitHub Free",
    category: "Software & Tools",
    offer: "Unlimited private repos plus free Actions and Codespaces minutes.",
    access: "Sign up free; no student status needed",
    url: "https://github.com/pricing",
    icon: Code2,
  },
  {
    id: "notion-personal",
    brand: "Notion",
    category: "Software & Tools",
    offer: "Free personal plan for notes, docs and planning, with AI add-ons.",
    access: "Sign up free with any email",
    url: "https://www.notion.so/pricing",
    icon: Cloud,
  },
  {
    id: "figma-starter",
    brand: "Figma",
    category: "Software & Tools",
    offer: "Free Starter plan for design and whiteboarding.",
    access: "Sign up free; paid tiers have trials",
    url: "https://www.figma.com/pricing/",
    icon: Palette,
  },
  {
    id: "canva-pro-trial",
    brand: "Canva Pro",
    category: "Software & Tools",
    offer: "Premium templates, brand kit and background remover.",
    access: "Start the free Pro trial",
    url: "https://www.canva.com/pricing/",
    icon: Sparkles,
  },

  // Workspace
  {
    id: "wework-on-demand",
    brand: "WeWork India",
    category: "Workspace",
    offer: "Book desks and meeting rooms by the day — no long-term membership.",
    access: "Book on-demand via the app",
    url: "https://wework.co.in/",
    icon: Building,
  },
  {
    id: "91springboard",
    brand: "91springboard",
    category: "Workspace",
    offer: "Flexible coworking day passes and hot desks across metros.",
    access: "Buy a day pass online",
    url: "https://www.91springboard.com/",
    icon: Building,
  },
  {
    id: "awfis",
    brand: "Awfis",
    category: "Workspace",
    offer: "Pay-per-use flexi desks and cabins in most major cities.",
    access: "Book flexi seating in the app",
    url: "https://www.awfis.com/",
    icon: Building,
  },

  // Finance & Taxes
  {
    id: "cleartax",
    brand: "ClearTax",
    category: "Finance & Taxes",
    offer: "Guided income-tax e-filing, free for most salaried returns.",
    access: "File free; expert-assisted plans are paid",
    url: "https://cleartax.in/",
    icon: Landmark,
  },
  {
    id: "zerodha",
    brand: "Zerodha",
    category: "Finance & Taxes",
    offer: "₹0 brokerage on equity delivery investing.",
    access: "Open an account with PAN + Aadhaar",
    url: "https://zerodha.com/",
    icon: LineChart,
  },
  {
    id: "groww",
    brand: "Groww",
    category: "Finance & Taxes",
    offer: "Commission-free direct mutual funds and stock investing.",
    access: "Sign up and complete KYC",
    url: "https://groww.in/",
    icon: Wallet,
  },
  {
    id: "indmoney",
    brand: "INDmoney",
    category: "Finance & Taxes",
    offer: "Track net worth, investments and spending in one free app.",
    access: "Sign up free",
    url: "https://www.indmoney.com/",
    icon: Banknote,
  },

  // Health & Wellness
  {
    id: "cultfit-pro",
    brand: "cult.fit",
    category: "Health & Wellness",
    offer: "Gym, group classes and at-home workouts; frequent corporate tie-ups.",
    access: "Check for your company's corporate plan",
    url: "https://www.cult.fit/",
    icon: Dumbbell,
  },
  {
    id: "practo-plus",
    brand: "Practo Plus",
    category: "Health & Wellness",
    offer: "Unlimited online doctor consults plus medicine discounts.",
    access: "Subscribe in the Practo app",
    url: "https://www.practo.com/plus",
    icon: Stethoscope,
  },
  {
    id: "healthifyme",
    brand: "HealthifyMe",
    category: "Health & Wellness",
    offer: "Nutrition tracking and coaching, with a free tier to start.",
    access: "Start free; premium coaching is paid",
    url: "https://www.healthifyme.com/",
    icon: HeartPulse,
  },
];

/** Everything a rendering surface needs for one audience: the tab label, the page subline, the
 * ordered category filters, and the catalog itself. Keyed by audience so the view can default to
 * the viewer's occupation and toggle to the other. */
export interface OfferAudienceConfig {
  id: Audience;
  label: string;
  description: string;
  categories: readonly string[];
  offers: Offer[];
}

export const OFFER_AUDIENCES: Record<Audience, OfferAudienceConfig> = {
  student: {
    id: "student",
    label: "Students",
    description: "Discounts and free-for-students programs you can use in India",
    categories: ["Software & Learning", "Entertainment", "Food & Shopping", "Travel", "Fitness"],
    offers: STUDENT_OFFERS,
  },
  professional: {
    id: "professional",
    label: "Professionals",
    description: "Perks, tools and services worth having as a working professional in India",
    categories: ["Learning & Upskilling", "Software & Tools", "Workspace", "Finance & Taxes", "Health & Wellness"],
    offers: PROFESSIONAL_PERKS,
  },
};

/** Maps a user's occupation to the audience whose catalog they should land on. Working
 * professionals default to the professional perks; students and anyone who hasn't set an
 * occupation default to the student offers (the broader audience for this app). */
export function defaultAudienceForOccupation(occupation: string | null | undefined): Audience {
  return occupation === "Working Professional" ? "professional" : "student";
}
