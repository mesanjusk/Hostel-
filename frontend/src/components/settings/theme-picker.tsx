import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { COLOR_THEMES, writeColorTheme, type ColorThemeId } from "@/lib/color-theme";
import { useColorTheme } from "@/lib/use-color-theme";
import { cn } from "@/lib/utils";

/**
 * Reusable color-theme picker: a 2-column grid of theme cards. Selecting a card writes the
 * preference (writeColorTheme) which repaints the whole app instantly via the color-theme event
 * (see use-color-theme.ts) — no reload, no server call. Used both in onboarding ("Pick your
 * vibe") and in Settings → Appearance.
 *
 * The active card reflects the live preference through useColorTheme(), so it stays in sync even
 * if the theme is changed elsewhere (e.g. another tab).
 */
export function ThemePicker({ className, onSelect }: { className?: string; onSelect?: (id: ColorThemeId) => void }) {
  const active = useColorTheme();

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {COLOR_THEMES.map((theme) => {
        const isActive = active === theme.id;
        return (
          <motion.button
            key={theme.id}
            type="button"
            aria-pressed={isActive}
            aria-label={`${theme.name} theme — ${theme.mood}`}
            onClick={() => {
              writeColorTheme(theme.id);
              onSelect?.(theme.id);
            }}
            whileTap={{ scale: 0.97 }}
            animate={{ scale: isActive ? 1.03 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "bg-card relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-shadow",
              isActive ? "border-primary shadow-md" : "border-border hover:shadow-sm",
            )}
            style={isActive ? { boxShadow: `0 8px 22px -10px ${theme.accent}80` } : undefined}
          >
            {isActive && (
              <span
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: theme.accent }}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}

            {/* Swatch chip row: accent circle + tint pill */}
            <div className="flex items-center gap-2">
              <span
                className="size-6 shrink-0 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: theme.accent }}
              />
              <span
                className="h-6 flex-1 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: theme.tint }}
              />
            </div>

            <div className="min-w-0">
              <p className="font-display text-sm font-semibold">{theme.name}</p>
              <p className="text-muted-foreground text-xs">{theme.mood}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
