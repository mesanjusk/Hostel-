import { Palette } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { GenderThemeFormDialog } from "@/features/admin/gender-theme-form-dialog";
import type { GenderThemeSettingsMap } from "@/features/admin/gender-theme-dto";

const BUILT_IN_DEFAULTS: Record<"Male" | "Female", { primary: string; secondary: string; accent: string }> = {
  Male: { primary: "#1e3a5f", secondary: "#3e5c76", accent: "#2e8bc0" },
  Female: { primary: "#c96b9a", secondary: "#8a5a6b", accent: "#e0956b" },
};

function ColorRow({ label, hex, fallback }: { label: string; hex: string | null; fallback: string }) {
  const shown = hex ?? fallback;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="border-border/60 inline-block size-5 rounded-full border" style={{ background: shown }} />
        <span className="font-mono text-xs">{hex ?? `${fallback} (default)`}</span>
      </span>
    </div>
  );
}

/**
 * Admin panel for the gender-based theme feature: lets an admin tune the Male/Female color
 * palettes and restrict each gender's enabled sticker set, without a code deploy. Only two
 * fixed entities (Male, Female) — "Other" and no-gender both use the Female entry, same rule
 * the frontend's theme/sticker resolvers already follow, so there's nothing to manage for them
 * separately. See lib/use-gender-theme.ts and lib/gender-stickers.ts for how these values are
 * actually applied.
 */
export function GenderThemeView({ settings }: { settings: GenderThemeSettingsMap | null }) {
  if (!settings) {
    return (
      <div>
        <PageHeader title="Gender Theme" description="Colors and stickers used for the Male vs Female visual theme" />
        <Card className="text-muted-foreground p-6 text-sm">Loading…</Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gender Theme"
        description="Colors and stickers used for the Male vs Female visual theme — changes apply on next page load, no deploy needed"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(["Male", "Female"] as const).map((key) => {
          const s = settings[key];
          const defaults = BUILT_IN_DEFAULTS[key];
          return (
            <Card key={key} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="text-muted-foreground size-4" />
                  <h3 className="font-semibold">{key}</h3>
                </div>
                <GenderThemeFormDialog settings={s} />
              </div>
              <div className="flex flex-col gap-2">
                <ColorRow label="Primary" hex={s.primaryColor} fallback={defaults.primary} />
                <ColorRow label="Secondary" hex={s.secondaryColor} fallback={defaults.secondary} />
                <ColorRow label="Accent" hex={s.accentColor} fallback={defaults.accent} />
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {s.stickerSlugs.length > 0
                  ? `${s.stickerSlugs.length} sticker(s) enabled (restricted from the full set)`
                  : "Using the full built-in sticker set"}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
