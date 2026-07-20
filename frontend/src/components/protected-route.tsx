import { useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { hasSelectedGender } from "@/lib/onboarding-gender";
import { HOME_ROUTE } from "@/lib/routes";
import { OtpLoginDialog } from "@/features/auth/otp-login-dialog";

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
 *
 * Gates on being *identified* (a linked mobile number), not merely having a `user` — every
 * visitor has a `user` from their very first page load now (see auth-context.tsx's anonymous
 * session), so gating on plain truthiness would bounce an anonymous visitor away from
 * /wa-login before they ever get a chance to actually register/log in.
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
  const identified = Boolean(user?.mobile);
  if (identified && !user!.needsOnboarding) {
    return <Navigate to={redirectTo} replace />;
  }
  if (identified && user!.needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (requireSelectedGender && !hasSelectedGender()) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

/** Gates the social/messaging surface (Chat, Community, Find-a-Roomie, Connections) behind an
 * actually-linked mobile number — every other feature works for a purely anonymous visitor
 * (see auth-context.tsx), but this corner of the app lets strangers message/match with each
 * other, which needs a real phone-verified identity behind it. Opens the OTP-login popup in
 * place (see otp-login-dialog.tsx) rather than navigating away to the full /wa-login page — the
 * moment it succeeds, `user.mobile` is set and this re-renders straight into `children`, no
 * navigation involved. The anonymous account (and everything saved under it) is preserved and
 * simply gains a mobile number, per the merge behavior in the backend's otp/widget-verify route. */
export function RequireIdentifiedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(true);

  if (loading) {
    return null;
  }

  if (!user?.mobile) {
    return (
      <>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-muted-foreground max-w-sm text-sm">
            Link your mobile number to use this feature — everything you've already added stays
            exactly where it is.
          </p>
          <Button type="button" onClick={() => setDialogOpen(true)}>
            Link mobile number
          </Button>
        </div>
        <OtpLoginDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return <>{children}</>;
}
