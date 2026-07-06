import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV_ITEM, OVERFLOW_NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/lib/nav-items";

export function OverflowMenu({ isAdmin }: { isAdmin: boolean }) {
  const items = [...OVERFLOW_NAV_ITEMS, SETTINGS_NAV_ITEM, ...(isAdmin ? [ADMIN_NAV_ITEM] : [])];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More">
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link to={item.href}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
