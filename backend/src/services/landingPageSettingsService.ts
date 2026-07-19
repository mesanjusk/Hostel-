import { connectDB } from "@/db";
import { LandingPageSettings } from "@/models/LandingPageSettings";

export interface LandingPageSettingsDTO {
  girlImageUrl: string | null;
  boyImageUrl: string | null;
  logoUrl: string | null;
  logoRedirectUrl: string | null;
}

interface LandingPageSettingsDocLike {
  girlImageUrl?: string | null;
  boyImageUrl?: string | null;
  logoUrl?: string | null;
  logoRedirectUrl?: string | null;
}

function toDTO(doc: LandingPageSettingsDocLike | null): LandingPageSettingsDTO {
  return {
    girlImageUrl: doc?.girlImageUrl ?? null,
    boyImageUrl: doc?.boyImageUrl ?? null,
    logoUrl: doc?.logoUrl ?? null,
    logoRedirectUrl: doc?.logoRedirectUrl ?? null,
  };
}

/** Public — read by every visitor's /welcome pre-login screen (see landing-page-settings.ts on
 * the frontend), so this must stay auth-free. A cold collection (no admin doc yet) just returns
 * both fields null — the landing page's SVG placeholder covers that case, never a hard error. */
export async function getLandingPageSettings(): Promise<LandingPageSettingsDTO> {
  await connectDB();
  const doc = await LandingPageSettings.findOne({ key: "welcome" }).lean();
  return toDTO(doc);
}

/** Admin-only: full-replace upsert of the girl/boy placeholder images. */
export async function updateLandingPageSettings(
  updates: LandingPageSettingsDTO,
): Promise<LandingPageSettingsDTO> {
  await connectDB();
  const doc = await LandingPageSettings.findOneAndUpdate(
    { key: "welcome" },
    { $set: { key: "welcome", ...updates } },
    { upsert: true, new: true },
  ).lean();
  return toDTO(doc);
}
