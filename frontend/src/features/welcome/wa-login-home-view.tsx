import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Heart,
  ListChecks,
  Luggage,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { BrandName } from "@/components/shared/brand-name";
import { useAuth } from "@/context/auth-context";

/** One card per Welcome-page ("home page after splash") scrapbook section, carried over
 * as a clickable entry point into the matching real app feature — this page is the
 * "professional" landing hub /wa-login sends people to after they're signed in. Styled
 * as pinned sticky notes, so text stays short (one handwritten line) by design. */
const HUB_CARDS: { section: string; title: string; href: string; icon: LucideIcon }[] = [
  { section: "Hero", title: "Checklist", href: "/checklist", icon: ListChecks },
  { section: "Mental Prep", title: "Survival Guide", href: "/guide/survival-guide", icon: BookOpen },
  { section: "Room Setup", title: "Bags", href: "/bags", icon: Luggage },
  { section: "Survival Hacks", title: "Shopping", href: "/shopping", icon: ShoppingBag },
  { section: "Bathroom Reality", title: "Toiletries", href: "/checklist", icon: ListChecks },
  { section: "Food Survival", title: "Budget", href: "/budget", icon: Wallet },
  { section: "Roommate Vibes", title: "Discover", href: "/discover", icon: Users },
  { section: "Underrated Essentials", title: "Wishlist", href: "/wishlist", icon: Heart },
  { section: "Final", title: "Documents", href: "/documents", icon: FileText },
];

/** One distinct pastel per note so the board reads as a set of colorful pinned notes. */
const CARD_BACKGROUNDS = [
  "#FFD9E8", // pastel pink
  "#FFE8C7", // pastel peach
  "#FFF6BA", // pastel lemon
  "#D9F5D6", // pastel mint
  "#CFF3EC", // pastel seafoam
  "#CFEAFF", // pastel sky
  "#D9DFFF", // pastel periwinkle
  "#E6D9FF", // pastel lavender
  "#FFD9D9", // pastel blush
];

/** Small alternating tilts so notes read as hand-pinned rather than machine-aligned. */
const CARD_ROTATIONS = [-3, 2.5, -2, 3, -3.5, 2, -2.5, 3.5, -2];
const PIN_ROTATIONS = [-8, 6, -4, 7, -6, 5, -5, 8, -3];

export function WaLoginHomeView() {
  const { user } = useAuth();
  const isOddCount = HUB_CARDS.length % 2 === 1;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={56} height={56} />
        <h1
          className="text-5xl font-bold sm:text-6xl"
          style={{ fontFamily: "var(--font-caveat-home)" }}
        >
          {user?.name ? `Hi, ${user.name.split(" ")[0]}!` : "Welcome!"}
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Here&apos;s where to start with <BrandName />.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">
        {HUB_CARDS.map((card, i) => (
          <motion.div
            key={card.section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={
              isOddCount && i === HUB_CARDS.length - 1
                ? "max-md:col-span-2 max-md:mx-auto max-md:w-[calc(50%-0.5rem)]"
                : undefined
            }
          >
            <Link
              to={card.href}
              className="sticky-note group flex aspect-square flex-col items-center justify-center gap-2 rounded-sm p-4 text-center shadow-[0_1px_1px_rgba(58,46,42,0.06),0_10px_18px_-10px_rgba(58,46,42,0.35)] transition-transform hover:-translate-y-1"
              style={{
                background: CARD_BACKGROUNDS[i % CARD_BACKGROUNDS.length],
                transform: `rotate(${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg)`,
              }}
            >
              <span
                className="sticky-pin"
                style={{ transform: `translateX(-50%) rotate(${PIN_ROTATIONS[i % PIN_ROTATIONS.length]}deg)` }}
              >
                <span className="sticky-pin-head" />
                <span className="sticky-pin-needle" />
              </span>
              <div className="flex size-11 items-center justify-center rounded-xl bg-white/60 shadow-sm">
                <card.icon className="size-5 text-[#3a2e2a]" />
              </div>
              <p
                className="text-2xl leading-none font-bold text-[#3a2e2a]"
                style={{ fontFamily: "var(--font-caveat-home)" }}
              >
                {card.title}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
