import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
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
import { SECTION_BACKGROUND_PRESETS } from "@/features/welcome/section-background-presets";

/** One card per Welcome-page ("home page after splash") scrapbook section, carried over
 * as a clickable entry point into the matching real app feature — this page is the
 * "professional" landing hub /wa-login sends people to after they're signed in. */
const HUB_CARDS: { section: string; title: string; description: string; href: string; icon: LucideIcon }[] = [
  { section: "Hero", title: "Your Checklist", description: "Everything you need before move-in day.", href: "/checklist", icon: ListChecks },
  { section: "Mental Prep", title: "Survival Guide", description: "Tips for the first-week jitters.", href: "/guide/survival-guide", icon: BookOpen },
  { section: "Room Setup", title: "Bags", description: "Pack and organize what goes where.", href: "/bags", icon: Luggage },
  { section: "Survival Hacks", title: "Shopping", description: "Hostel survival essentials to grab.", href: "/shopping", icon: ShoppingBag },
  { section: "Bathroom Reality", title: "Toiletries Checklist", description: "Bathroom essentials, sorted.", href: "/checklist", icon: ListChecks },
  { section: "Food Survival", title: "Budget", description: "Track mess funds and food spend.", href: "/budget", icon: Wallet },
  { section: "Roommate Vibes", title: "Discover", description: "Find your roommate and travel buddies.", href: "/discover", icon: Users },
  { section: "Underrated Essentials", title: "Wishlist", description: "Save the small things you'll actually need.", href: "/wishlist", icon: Heart },
  { section: "Final", title: "Documents", description: "Keep your paperwork in order.", href: "/documents", icon: FileText },
];

const CARD_BACKGROUNDS = [
  SECTION_BACKGROUND_PRESETS.sunrise,
  SECTION_BACKGROUND_PRESETS.cream,
  SECTION_BACKGROUND_PRESETS.dusk,
];

export function WaLoginHomeView() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={56} height={56} />
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {user?.name ? `You're in, ${user.name.split(" ")[0]}!` : "You're in!"}
        </h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Here&apos;s where to start with <BrandName />.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HUB_CARDS.map((card, i) => (
          <motion.div
            key={card.section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={card.href}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 p-5 shadow-sm shadow-black/[0.02] transition-transform hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: CARD_BACKGROUNDS[i % CARD_BACKGROUNDS.length] }}
            >
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-white/70 shadow-sm">
                  <card.icon className="size-5 text-[#3a2e2a]" />
                </div>
                <ArrowRight className="size-4 text-[#3a2e2a]/50 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-6">
                <p className="text-xs font-medium tracking-wide text-[#3a2e2a]/60 uppercase">{card.section}</p>
                <p className="font-display mt-1 text-lg font-semibold text-[#3a2e2a]">{card.title}</p>
                <p className="mt-1 text-sm text-[#3a2e2a]/70">{card.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
