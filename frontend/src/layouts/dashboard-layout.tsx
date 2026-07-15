import { Outlet } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { FabMenu } from "@/components/shared/fab-menu";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { useHiddenNavHrefs } from "@/features/nav/use-nav-visibility";

export function DashboardLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const hiddenNavHrefs = useHiddenNavHrefs();

  return (
    <div className="bg-background relative flex min-h-dvh overflow-x-clip">
      <Sidebar isAdmin={isAdmin} hiddenHrefs={hiddenNavHrefs} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar isAdmin={isAdmin} hiddenNavHrefs={hiddenNavHrefs} />
        <main className="flex-1 px-4 pt-4 pb-24 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav hiddenNavHrefs={hiddenNavHrefs} />
      <FabMenu hiddenNavHrefs={hiddenNavHrefs} />
      <PWAInstallPrompt />
    </div>
  );
}
