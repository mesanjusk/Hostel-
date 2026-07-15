import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav-items";

export function BottomNav({ hiddenNavHrefs }: { hiddenNavHrefs?: Set<string> }) {
  const { pathname } = useLocation();
  const [left, right] = [BOTTOM_NAV_ITEMS.slice(0, 2), BOTTOM_NAV_ITEMS.slice(2)];
  const visibleLeft = left.filter((item) => !hiddenNavHrefs?.has(item.href));
  const visibleRight = right.filter((item) => !hiddenNavHrefs?.has(item.href));

  function renderItem(item: (typeof BOTTOM_NAV_ITEMS)[number]) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className={cn("size-5 shrink-0", active && "scale-110")} />
        <span className="w-full truncate text-center">{item.label}</span>
      </Link>
    );
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      {/* Blur lives on its own layer, not the fixed element itself — Safari detaches
       * `position: fixed` from the viewport when `backdrop-filter` is applied directly to it. */}
      <div className="absolute inset-0 -z-10 backdrop-blur-md" aria-hidden="true" />
      <div className="flex items-stretch justify-between px-1 pt-2">
        {visibleLeft.map(renderItem)}
        <div className="w-12 shrink-0" aria-hidden="true" />
        {visibleRight.map(renderItem)}
      </div>
    </nav>
  );
}
