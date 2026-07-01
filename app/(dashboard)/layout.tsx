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
    <div className="relative flex min-h-screen overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-float bg-primary/10 absolute -top-32 -left-24 size-96 rounded-full blur-3xl" />
        <div
          className="animate-float bg-accent/10 absolute top-1/3 -right-32 size-[28rem] rounded-full blur-3xl"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="animate-float bg-secondary/10 absolute bottom-0 left-1/4 size-96 rounded-full blur-3xl"
          style={{ animationDelay: "4s" }}
        />
        <div className="grain-overlay absolute inset-0 opacity-40" />
      </div>

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
