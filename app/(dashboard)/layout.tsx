import { auth } from "@/lib/auth";
import { getUserById } from "@/services/userService";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ? await getUserById(session.user.id) : null;
  const isAdmin = session?.user.role === "admin";

  return (
    <div className="bg-background relative flex min-h-screen overflow-x-clip">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          name={user?.name ?? null}
          mobile={user?.mobile ?? session?.user.mobile ?? ""}
          avatar={user?.avatar ?? null}
        />
        <main className="flex-1 px-4 pt-4 pb-24 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
