import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--auth-bg-from)] via-[var(--auth-bg-via)] to-[var(--auth-bg-to)] px-4 py-12">
      {/* Soft blurred blobs for a floating, airy feel behind the auth cards — colors follow the
          gender theme (index.css --auth-blob-* tokens) so this backdrop matches the girl/boy
          pick made on /welcome, same as the rest of the app. */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-[var(--auth-blob-1)]/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-28 size-80 rounded-full bg-[var(--auth-blob-2)]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-[var(--auth-blob-3)]/60 blur-3xl" />
      <div className="relative">
        <Outlet />
      </div>
    </div>
  );
}
