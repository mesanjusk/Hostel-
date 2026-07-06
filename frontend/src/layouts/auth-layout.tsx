import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <Outlet />
    </div>
  );
}
