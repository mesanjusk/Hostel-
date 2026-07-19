import { Link } from "react-router-dom";
import { Download, MoreVertical, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { emitComingSoon } from "@/lib/coming-soon-bus";
import { ADMIN_NAV_ITEM } from "@/lib/nav-items";
import { usePwaInstall } from "@/lib/use-pwa-install";
import { HUB_CARDS, type HubCardDef } from "@/features/welcome/hub-widget-registry";
import { useHubLayout } from "@/features/welcome/use-hub-layout";

async function sharePage() {
  const shareData = { title: "Pack with Me", url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // user cancelled — no-op
    }
    return;
  }
  await navigator.clipboard.writeText(shareData.url);
  toast.success("Link copied to clipboard");
}

interface VisibleCard extends HubCardDef {
  live: boolean;
}

/** Groups the visible home cards into their scrapbook sections, in each section's first-seen
 * order — cards sharing a section stay together even if the admin's saved order interleaves
 * them with cards from other sections (e.g. a newly added card appended past a section it
 * conceptually belongs to; see the "find-a-roomie" comment in hub-widget-registry.ts). */
function groupBySection(cards: VisibleCard[]): { section: string; cards: VisibleCard[] }[] {
  const order: string[] = [];
  const bySection = new Map<string, VisibleCard[]>();
  for (const card of cards) {
    let group = bySection.get(card.section);
    if (!group) {
      group = [];
      bySection.set(card.section, group);
      order.push(card.section);
    }
    group.push(card);
  }
  return order.map((section) => ({ section, cards: bySection.get(section)! }));
}

/** The mobile "more" (3-dot) menu: every home-screen card grouped into the same sections shown
 * on the home page, plus account-adjacent actions (install, share) and the app version — each
 * rendered as its own labeled section rather than one flat list. */
export function OverflowMenu({ isAdmin }: { isAdmin: boolean }) {
  const { cards } = useHubLayout();
  const { installed, isIOS, canInstall, promptInstall } = usePwaInstall();

  const cardsById = new Map(HUB_CARDS.map((card) => [card.id, card]));
  const visibleCards = cards
    .filter((entry) => entry.visible)
    .map((entry) => {
      const card = cardsById.get(entry.id);
      return card ? { ...card, live: entry.live } : undefined;
    })
    .filter((c): c is VisibleCard => c !== undefined);
  const sections = groupBySection(visibleCards);

  function handleInstall() {
    if (canInstall) {
      promptInstall();
      return;
    }
    if (isIOS) {
      toast.info('Tap Share, then "Add to Home Screen" to install.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More">
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto">
        {sections.map((group) => (
          <div key={group.section}>
            <DropdownMenuLabel className="font-normal">{group.section}</DropdownMenuLabel>
            {group.cards.map((card) => {
              const Icon = card.icon;
              if (!card.live) {
                return (
                  <DropdownMenuItem
                    key={card.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      emitComingSoon(card.title);
                    }}
                  >
                    <Icon className="size-4" />
                    {card.title}
                  </DropdownMenuItem>
                );
              }
              return (
                <DropdownMenuItem key={card.id} asChild>
                  <Link to={card.href}>
                    <Icon className="size-4" />
                    {card.title}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">Admin</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={ADMIN_NAV_ITEM.href}>
                <ADMIN_NAV_ITEM.icon className="size-4" />
                {ADMIN_NAV_ITEM.label}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">App</DropdownMenuLabel>
        {!installed && (
          <DropdownMenuItem onSelect={handleInstall} disabled={!canInstall && !isIOS}>
            <Download className="size-4" />
            Install app
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={sharePage}>
          <Share2 className="size-4" />
          Share
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">{__APP_VERSION__}</DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
