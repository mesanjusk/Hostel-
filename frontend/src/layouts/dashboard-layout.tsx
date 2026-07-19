import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { FabMenu } from "@/components/shared/fab-menu";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { useNavLayout } from "@/features/nav/use-nav-layout";
import { prefetchNavDestinations } from "@/lib/prefetch-nav";

export function DashboardLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const nav = useNavLayout();

  // This layout stays mounted across every tab switch (only the <Outlet> content changes),
  // so it only fires once per session — right after the user lands, on the home page or
  // wherever they enter the app. It waits for the real layout so it can skip destinations
  // this install has hidden; prefetchNavDestinations itself is idempotent.
  useEffect(() => {
    if (!nav.ready) return;
    prefetchNavDestinations(nav.allOrderedItems.map((item) => item.href));
  }, [nav.ready, nav.allOrderedItems]);

  // Until the real layout is known, render the nav chrome empty rather than falling back to the
  // shipped default: the default disagrees with a customized layout about which entries exist
  // and where they sit, so painting it first is what made hidden features appear for a moment
  // and then rearrange or vanish. The bars keep their size while empty, so filling them in a
  // moment later doesn't shift the page.
  const bottomItems = nav.ready ? nav.bottomItems : [];
  const allOrderedItems = nav.ready ? nav.allOrderedItems : [];

  return (
    <div className="bg-background relative flex min-h-dvh overflow-x-clip">
      <Sidebar isAdmin={isAdmin} items={allOrderedItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar isAdmin={isAdmin} />
        <main className="flex-1 px-4 pt-4 pb-24 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav items={bottomItems} />
      {nav.ready && nav.fabVisible && <FabMenu />}
      <PWAInstallPrompt />
    </div>
  );
}
