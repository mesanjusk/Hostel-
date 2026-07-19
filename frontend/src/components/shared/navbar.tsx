import { Link, useLocation } from "react-router-dom";

import { BrandName } from "@/components/shared/brand-name";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import { UserMenu } from "@/components/shared/user-menu";
import { GlobalSearch } from "@/features/search/global-search";
import { HOME_ROUTE } from "@/lib/nav-items";

interface NavbarProps {
  isAdmin: boolean;
}

export function Navbar({ isAdmin }: NavbarProps) {
  // Community (and each individual community's page) has its own "Search communities" box
  // under Discover — the app-wide "Search everything" command palette is redundant there.
  const { pathname } = useLocation();
  const showGlobalSearch = !pathname.startsWith("/community");

  return (
    <header className="sticky top-0 z-30 px-4 py-3 lg:px-8">
      {/* Blur lives on its own layer, not the sticky element itself — Safari detaches
       * `position: sticky` when `backdrop-filter` is applied directly to it. */}
      <div className="absolute inset-0 -z-10 backdrop-blur-md" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3">
        <Link to={HOME_ROUTE} className="flex items-center gap-2 lg:hidden">
          <img src="/logo.png" alt="" width={24} height={24} />
          <BrandName />
        </Link>
        {showGlobalSearch && (
          <div className="hidden flex-1 lg:block">
            <GlobalSearch />
          </div>
        )}
        <div className="flex items-center gap-2">
          {showGlobalSearch && (
            <div className="lg:hidden">
              <GlobalSearch />
            </div>
          )}
          <UserMenu />
          <div className="lg:hidden">
            <OverflowMenu isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
