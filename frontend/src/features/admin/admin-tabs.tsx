import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/guide", label: "Guide" },
  { href: "/admin/cities", label: "Cities" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/reported-contacts", label: "Reported Contacts" },
  { href: "/admin/college-categories", label: "College Categories" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/checklist-templates", label: "Checklist Templates" },
  { href: "/admin/default-checklist", label: "Default Checklist" },
  { href: "/admin/checklist-health", label: "Checklist Health" },
  { href: "/admin/suggested-items", label: "Suggested Items" },
  { href: "/admin/pending-registrations", label: "Pending WA Signups" },
  { href: "/admin/layout", label: "Dashboard Layout" },
  { href: "/admin/nav", label: "Nav Items" },
  { href: "/admin/home-cards", label: "Home Cards" },
  { href: "/admin/home-screen", label: "Home Screen" },
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
