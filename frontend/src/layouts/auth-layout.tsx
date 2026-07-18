import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFE8D6] via-[#FFD9E8] to-[#FDF6EE] px-4 py-12">
      {/* Soft blurred pastel blobs for a floating, airy feel behind the auth cards */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-[#FFC9A8]/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-28 size-80 rounded-full bg-[#FFB3D1]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-[#FFF3C4]/60 blur-3xl" />
      <div className="relative">
        <Outlet />
      </div>
    </div>
  );
}
