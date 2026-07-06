import { Outlet } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { FabMenu } from "@/components/shared/fab-menu";

export function DashboardLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="bg-background relative flex min-h-dvh overflow-x-clip">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar isAdmin={isAdmin} />
        <main className="flex-1 px-4 pt-4 pb-24 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FabMenu />
    </div>
  );
}
