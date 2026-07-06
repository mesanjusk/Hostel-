import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/guide", label: "Guide" },
];

export function AdminTabs() {
  const { pathname } = useLocation();

  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
