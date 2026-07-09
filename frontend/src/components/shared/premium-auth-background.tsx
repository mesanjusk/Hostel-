import { motion } from "framer-motion";

/**
 * Full-bleed ambient backdrop for the login screen — same brand gradient + grain texture as the
 * splash/welcome flow (see splash-screen.tsx, moodboard-view.tsx) so /login reads as part of the
 * same design system instead of a bare form. Purely decorative: aria-hidden, no interaction.
 */
export function PremiumAuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 55%), radial-gradient(120% 90% at 85% 100%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 55%)",
        }}
      />

      <motion.div
        className="absolute -top-24 -left-24 size-[22rem] rounded-full blur-3xl"
        style={{ background: "var(--gradient-brand)", opacity: 0.28 }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.22, 0.32, 0.22] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-28 size-[26rem] rounded-full blur-3xl"
        style={{ background: "var(--gradient-brand)", opacity: 0.2 }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.16, 0.26, 0.16] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        className="bg-secondary absolute -bottom-32 left-1/4 size-[18rem] rounded-full blur-3xl"
        style={{ opacity: 0.14 }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />

      <div className="grain-overlay absolute inset-0" style={{ opacity: 0.5 }} />
    </div>
  );
}
