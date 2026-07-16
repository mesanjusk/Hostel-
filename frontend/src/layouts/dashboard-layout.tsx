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
  const { bottomItems, overflowItems, allOrderedItems, hiddenHrefs, fabVisible } = useNavLayout();

  // This layout stays mounted across every tab switch (only the <Outlet> content changes),
  // so it only fires once per session — right after the user lands, on the home page or
  // wherever they enter the app.
  useEffect(() => {
    prefetchNavDestinations();
  }, []);

  return (
    <div className="bg-background relative flex min-h-dvh overflow-x-clip">
      <Sidebar isAdmin={isAdmin} items={allOrderedItems} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar isAdmin={isAdmin} overflowItems={overflowItems} />
        <main className="flex-1 px-4 pt-4 pb-24 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav items={bottomItems} />
      {fabVisible && <FabMenu hiddenNavHrefs={hiddenHrefs} />}
      <PWAInstallPrompt />
    </div>
  );
}
