"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav-items";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MoreMenu } from "@/components/shared/more-menu";

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-around px-2 py-2 lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("size-5", active && "scale-110")} />
            {item.label}
          </Link>
        );
      })}
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium"
          >
            <Menu className="size-5" />
            More
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <MoreMenu isAdmin={isAdmin} />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
