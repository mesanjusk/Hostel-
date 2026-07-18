import { Link } from "react-router-dom";
import { MoreVertical, Share2 } from "lucide-react";
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
import { ADMIN_NAV_ITEM, type NavItem } from "@/lib/nav-items";

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

export function OverflowMenu({ isAdmin, items }: { isAdmin: boolean; items: NavItem[] }) {
  const allItems = [...items, ...(isAdmin ? [ADMIN_NAV_ITEM] : [])];
  const hasProfileItem = allItems.some((item) => item.href === "/profile");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More">
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {allItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.href}>
              <DropdownMenuItem asChild>
                <Link to={item.href}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
              {item.href === "/profile" && (
                <DropdownMenuItem onSelect={sharePage}>
                  <Share2 className="size-4" />
                  Share
                </DropdownMenuItem>
              )}
            </div>
          );
        })}
        {!hasProfileItem && (
          <DropdownMenuItem onSelect={sharePage}>
            <Share2 className="size-4" />
            Share
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">{__APP_VERSION__}</DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
