/**
 * Seeds a starter shortlist of real colleges per (city, college category) into the College
 * catalog, so the onboarding/profile college picker isn't empty on a fresh deploy. Idempotent —
 * upserts by (city, category, slug), safe to re-run.
 *
 * This is a curated starting point, not an exhaustive directory — the picker always offers an
 * "Other" fallback for anything missing, and admins can add more colleges for other cities from
 * the admin panel at any time.
 *
 * `nirfRank` is only set for the seven oldest IITs, whose relative order in the NIRF
 * Engineering ranking has been stable for years (Madras, Delhi, Bombay, Kanpur, Kharagpur,
 * Roorkee, Guwahati, in that order) — everything else here (including newer IITs, NITs and all
 * Design entries, since NIRF doesn't publish a Design-specific ranking) is ordered via
 * `sortOrder` by general reputation instead of a claimed exact rank, to avoid asserting NIRF
 * numbers this script can't guarantee are current.
 *
 * Usage: npm run seed:colleges
 */
import "dotenv/config";
import mongoose from "mongoose";

import { College } from "@/models/College";
import { CollegeCategory } from "@/models/CollegeCategory";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SeedCollege = { city: string; name: string; nirfRank?: number; sortOrder?: number };

const ENGINEERING: SeedCollege[] = [
  // The seven oldest IITs — stable relative NIRF Engineering order.
  { city: "Chennai", name: "IIT Madras", nirfRank: 1 },
  { city: "Delhi", name: "IIT Delhi", nirfRank: 2 },
  { city: "Mumbai", name: "IIT Bombay", nirfRank: 3 },
  { city: "Kanpur", name: "IIT Kanpur", nirfRank: 4 },
  { city: "Kharagpur", name: "IIT Kharagpur", nirfRank: 5 },
  { city: "Roorkee", name: "IIT Roorkee", nirfRank: 6 },
  { city: "Guwahati", name: "IIT Guwahati", nirfRank: 7 },

  // Other well-known institutes, curated order (no asserted NIRF number).
  { city: "Hyderabad", name: "IIT Hyderabad", sortOrder: 1 },
  { city: "Varanasi", name: "IIT (BHU) Varanasi", sortOrder: 1 },

  { city: "Mumbai", name: "Institute of Chemical Technology (ICT)", sortOrder: 10 },
  { city: "Mumbai", name: "Veermata Jijabai Technological Institute (VJTI)", sortOrder: 20 },
  { city: "Mumbai", name: "Sardar Patel Institute of Technology (SPIT)", sortOrder: 30 },
  { city: "Mumbai", name: "K J Somaiya College of Engineering", sortOrder: 40 },
  { city: "Mumbai", name: "Sardar Patel College of Engineering", sortOrder: 50 },

  { city: "Delhi", name: "Delhi Technological University (DTU)", sortOrder: 10 },
  { city: "Delhi", name: "Netaji Subhas University of Technology (NSUT)", sortOrder: 20 },
  { city: "Delhi", name: "Indraprastha Institute of Information Technology Delhi (IIIT-Delhi)", sortOrder: 30 },
  { city: "Delhi", name: "Jamia Millia Islamia — Faculty of Engineering and Technology", sortOrder: 40 },

  { city: "Bengaluru", name: "Indian Institute of Science (IISc) Bengaluru", sortOrder: 5 },
  { city: "Bengaluru", name: "RV College of Engineering", sortOrder: 10 },
  { city: "Bengaluru", name: "BMS College of Engineering", sortOrder: 20 },
  { city: "Bengaluru", name: "PES University", sortOrder: 30 },
  { city: "Bengaluru", name: "M S Ramaiah Institute of Technology", sortOrder: 40 },

  { city: "Chennai", name: "Anna University (CEG Campus)", sortOrder: 10 },
  { city: "Chennai", name: "SSN College of Engineering", sortOrder: 20 },
  { city: "Chennai", name: "VIT Chennai", sortOrder: 30 },
  { city: "Chennai", name: "SRM Institute of Science and Technology, Chennai", sortOrder: 40 },

  { city: "Pune", name: "College of Engineering Pune (COEP Technological University)", sortOrder: 10 },
  { city: "Pune", name: "Pune Institute of Computer Technology (PICT)", sortOrder: 20 },
  { city: "Pune", name: "Vishwakarma Institute of Technology", sortOrder: 30 },
  { city: "Pune", name: "MIT World Peace University", sortOrder: 40 },

  { city: "Hyderabad", name: "BITS Pilani Hyderabad Campus", sortOrder: 10 },
  { city: "Hyderabad", name: "International Institute of Information Technology, Hyderabad (IIIT-H)", sortOrder: 20 },
  { city: "Hyderabad", name: "Osmania University College of Engineering", sortOrder: 30 },

  { city: "Kolkata", name: "Jadavpur University", sortOrder: 10 },
  { city: "Kolkata", name: "Indian Institute of Engineering Science and Technology (IIEST), Shibpur", sortOrder: 20 },
  { city: "Kolkata", name: "Heritage Institute of Technology", sortOrder: 30 },

  { city: "Tiruchirappalli", name: "NIT Tiruchirappalli", sortOrder: 5 },
  { city: "Warangal", name: "NIT Warangal", sortOrder: 5 },
  { city: "Mangaluru", name: "NIT Surathkal", sortOrder: 5 },
  { city: "Kozhikode", name: "NIT Calicut", sortOrder: 5 },
  { city: "Jaipur", name: "Malaviya National Institute of Technology (MNIT) Jaipur", sortOrder: 5 },
  { city: "Surat", name: "Sardar Vallabhbhai National Institute of Technology (SVNIT)", sortOrder: 5 },
  { city: "Nagpur", name: "Visvesvaraya National Institute of Technology (VNIT)", sortOrder: 5 },
  { city: "Bhopal", name: "Maulana Azad National Institute of Technology (MANIT)", sortOrder: 5 },

  { city: "Ahmedabad", name: "Nirma University — Institute of Technology", sortOrder: 10 },
  { city: "Ahmedabad", name: "L D College of Engineering", sortOrder: 20 },
];

const DESIGN: SeedCollege[] = [
  { city: "Ahmedabad", name: "National Institute of Design (NID), Ahmedabad", sortOrder: 1 },

  { city: "Delhi", name: "National Institute of Fashion Technology (NIFT), Delhi", sortOrder: 10 },
  { city: "Delhi", name: "Pearl Academy, Delhi", sortOrder: 20 },

  { city: "Mumbai", name: "National Institute of Fashion Technology (NIFT), Mumbai", sortOrder: 10 },
  { city: "Mumbai", name: "Sir J J Institute of Applied Art", sortOrder: 20 },
  { city: "Mumbai", name: "Pearl Academy, Mumbai", sortOrder: 30 },

  { city: "Bengaluru", name: "National Institute of Fashion Technology (NIFT), Bengaluru", sortOrder: 10 },
  { city: "Bengaluru", name: "National Institute of Design (NID), Bengaluru", sortOrder: 20 },
  { city: "Bengaluru", name: "Srishti Manipal Institute of Art, Design and Technology", sortOrder: 30 },

  { city: "Chennai", name: "National Institute of Fashion Technology (NIFT), Chennai", sortOrder: 10 },

  { city: "Kolkata", name: "National Institute of Fashion Technology (NIFT), Kolkata", sortOrder: 10 },

  { city: "Hyderabad", name: "National Institute of Fashion Technology (NIFT), Hyderabad", sortOrder: 10 },

  { city: "Pune", name: "Symbiosis Institute of Design", sortOrder: 10 },
  { city: "Pune", name: "MIT Institute of Design", sortOrder: 20 },
];

const CATEGORY_SEEDS: Record<string, SeedCollege[]> = {
  Engineering: ENGINEERING,
  Design: DESIGN,
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  let created = 0;
  let skipped = 0;

  for (const [categoryName, colleges] of Object.entries(CATEGORY_SEEDS)) {
    const category = await CollegeCategory.findOne({ slug: slugify(categoryName) }).lean();
    if (!category) {
      console.warn(`  Skipping "${categoryName}" — no matching CollegeCategory found. Run seed:checklist-taxonomy first.`);
      continue;
    }

    for (const college of colleges) {
      const city = college.city.trim();
      const name = college.name.trim();
      const slug = slugify(name);
      const result = await College.findOneAndUpdate(
        { city, collegeCategoryId: category._id, slug },
        {
          $setOnInsert: {
            city,
            collegeCategoryId: category._id,
            name,
            slug,
            nirfRank: college.nirfRank ?? null,
            sortOrder: college.sortOrder ?? 0,
            active: true,
          },
        },
        { upsert: true, new: false },
      );
      if (result) {
        skipped += 1;
      } else {
        created += 1;
        console.log(`  + ${city} / ${categoryName}: ${name}`);
      }
    }
  }

  console.log(`Colleges seeded: ${created} created, ${skipped} already present.`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed colleges:", error);
  process.exit(1);
});
