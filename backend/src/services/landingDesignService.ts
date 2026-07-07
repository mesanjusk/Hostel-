import { connectDB } from "@/db";
import { LandingDesign } from "@/models/LandingDesign";

export interface ElementLayoutOverride {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  visible?: boolean;
}

export interface ElementOverride {
  id: string;
  lines?: string[];
  ctaLabel?: string;
  layouts?: {
    mobile?: ElementLayoutOverride;
    desktop?: ElementLayoutOverride;
  };
}

export interface SectionBackgroundOverride {
  id: string;
  background: string;
}

export interface LandingDesignData {
  elements: ElementOverride[] | null;
  sectionBackgrounds: SectionBackgroundOverride[] | null;
}

const HOME_PAGE = "home";

/** Public — the home screen is shown to signed-out visitors too. */
export async function getLandingDesign(): Promise<LandingDesignData> {
  await connectDB();
  const doc = await LandingDesign.findOne({ page: HOME_PAGE }).lean();
  // Mongoose's inferred lean() type marks optional nested fields as `T | null` (from its
  // own schema typing) rather than `T | undefined` as declared here — the shapes are
  // runtime-compatible (both mean "absent"), so this cast just bridges that gap.
  return {
    elements: (doc?.elements as unknown as ElementOverride[] | undefined) ?? null,
    sectionBackgrounds: (doc?.sectionBackgrounds as unknown as SectionBackgroundOverride[] | undefined) ?? null,
  };
}

/** Admin-only: persists the drag/resize/rotate/hide/text overrides and section background
 * choices for the home screen. */
export async function saveLandingDesign(
  elements: ElementOverride[],
  sectionBackgrounds: SectionBackgroundOverride[],
): Promise<LandingDesignData> {
  await connectDB();
  await LandingDesign.findOneAndUpdate(
    { page: HOME_PAGE },
    { elements, sectionBackgrounds },
    { upsert: true },
  );
  return { elements, sectionBackgrounds };
}
