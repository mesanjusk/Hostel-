import { createLucideIcon } from "lucide-react";

/** Lucide's built-in "Users"/"UsersRound" icons are two-person glyphs — the Community nav
 * item wants a three-person cluster, like WhatsApp's Community icon. Follows lucide's own
 * "Users" grammar (one fully-drawn head+body, second person implied by a body-outline peek
 * with no separate head) rather than three full head circles, which reads as clutter at
 * 18-20px nav-icon size — here the peek is mirrored on both sides for a third person. Built
 * with lucide's own icon factory so it's a drop-in `LucideIcon` — same size/color/strokeWidth
 * props as every other nav icon. */
export const CommunityIcon = createLucideIcon("community", [
  ["path", { d: "M21 21v-1.5a4 4 0 0 0-3-3.87", key: "community-peek-right-body" }],
  ["path", { d: "M20 3.5a3.5 3.5 0 0 1 0 6.75", key: "community-peek-right-shoulder" }],
  ["path", { d: "M3 21v-1.5a4 4 0 0 1 3-3.87", key: "community-peek-left-body" }],
  ["path", { d: "M4 3.5a3.5 3.5 0 0 0 0 6.75", key: "community-peek-left-shoulder" }],
  ["circle", { cx: "12", cy: "8", r: "3.5", key: "community-head-front" }],
  ["path", { d: "M6.5 21v-1.5a5.5 5.5 0 0 1 11 0v1.5", key: "community-body-front" }],
]);
