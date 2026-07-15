import { Link } from "react-router-dom";

import { BrandName } from "@/components/shared/brand-name";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import { GlobalSearch } from "@/features/search/global-search";
import { HOME_ROUTE } from "@/lib/nav-items";

interface NavbarProps {
  isAdmin: boolean;
  hiddenNavHrefs?: Set<string>;
}

export function Navbar({ isAdmin, hiddenNavHrefs }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-transparent px-4 py-3 backdrop-blur-md lg:px-8">
      <Link to={HOME_ROUTE} className="flex items-center gap-2 lg:hidden">
        <img src="/logo.png" alt="" width={24} height={24} />
        <BrandName />
      </Link>
      <div className="hidden flex-1 lg:block">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <div className="lg:hidden">
          <GlobalSearch />
        </div>
        <div className="lg:hidden">
          <OverflowMenu isAdmin={isAdmin} hiddenHrefs={hiddenNavHrefs} />
        </div>
      </div>
    </header>
  );
}
