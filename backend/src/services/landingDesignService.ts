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

const HOME_PAGE = "home";

/** Public — the home screen is shown to signed-out visitors too. */
export async function getLandingDesign(): Promise<ElementOverride[] | null> {
  await connectDB();
  const doc = await LandingDesign.findOne({ page: HOME_PAGE }).lean();
  return doc?.elements ?? null;
}

/** Admin-only: persists the drag/resize/rotate/hide/text overrides for the home screen. */
export async function saveLandingDesign(elements: ElementOverride[]): Promise<ElementOverride[]> {
  await connectDB();
  await LandingDesign.findOneAndUpdate({ page: HOME_PAGE }, { elements }, { upsert: true });
  return elements;
}
