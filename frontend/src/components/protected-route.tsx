import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/context/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!user.needsOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/checklist" replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== "admin") {
    return <Navigate to="/checklist" replace />;
  }
  return <>{children}</>;
}

export function AuthOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (user && !user.needsOnboarding) {
    return <Navigate to="/checklist" replace />;
  }
  if (user && user.needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
