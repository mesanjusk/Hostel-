import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/context/auth-context";
import { hasSelectedGender } from "@/lib/onboarding-gender";
import { HOME_ROUTE } from "@/lib/routes";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/wa-login" replace state={{ from: location }} />;
  }

  if (user.needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!user.needsOnboarding && location.pathname === "/onboarding") {
    // Same reactive-redirect-wins-the-race situation as AuthOnlyRoute below: this guard's
    // own redirect fires (and wins) before OnboardingForm's own post-submit navigate() can
    // take effect, so this is the actual authority over where onboarding completion lands.
    return <Navigate to={HOME_ROUTE} replace />;
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

/**
 * `redirectTo` is the actual authority over where a login/register/reset submission lands
 * once it succeeds — this guard's own redirect fires reactively (on the `user` state change
 * from the login call) and consistently wins the race against any `navigate()` the form
 * itself calls right after, since that reactive redirect commits after the form's own
 * synchronous handler already ran. Defaults to the main app's home route; pass a different
 * target for routes (like /wa-login) that should land somewhere else after signing in.
 */
export function AuthOnlyRoute({
  children,
  redirectTo = HOME_ROUTE,
  requireSelectedGender = false,
}: {
  children: ReactNode;
  redirectTo?: string;
  /** Gates this route behind the pre-login gender pick on the landing page — used only for
   * /wa-login, so a direct/bookmarked visit still goes through /welcome first. */
  requireSelectedGender?: boolean;
}) {
  const { user, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (user && !user.needsOnboarding) {
    return <Navigate to={redirectTo} replace />;
  }
  if (user && user.needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (requireSelectedGender && !hasSelectedGender()) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}
