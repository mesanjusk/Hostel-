import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { hasSelectedGender } from "@/lib/onboarding-gender";
import { HOME_ROUTE } from "@/lib/routes";
import { OtpLoginDialog } from "@/features/auth/otp-login-dialog";

/** Stands the anonymous session back up when we've somehow ended up with none, without ever
 * navigating away. Renders nothing while it's working — the app shell is already painted and
 * this normally resolves in one round-trip, so a spinner would just flash. Only a genuinely
 * unreachable server surfaces anything, and then it's a retry, not a login prompt. */
function SessionRecovery() {
  const { ensureSession } = useAuth();
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureSession().then((ok) => {
      if (!cancelled && !ok) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ensureSession]);

  if (!failed) return null;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground max-w-sm text-sm">
        We couldn't reach the server. Check your connection and try again — nothing you've saved
        is lost.
      </p>
      <Button
        type="button"
        disabled={retrying}
        onClick={async () => {
          setRetrying(true);
          const ok = await ensureSession();
          setRetrying(false);
          if (ok) setFailed(false);
        }}
      >
        {retrying ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    // NOT a redirect to /wa-login. Every visitor is supposed to get an anonymous account on
    // boot, so `user: null` here doesn't mean "logged out", it means the bootstrap hasn't
    // landed yet (cold backend, offline, or a token that just died). Sending them to the login
    // page in that window is what made packwithme.co.in bounce people to /wa-login — the exact
    // entry barrier the anonymous-visitor work exists to remove. Recover in place instead.
    return <SessionRecovery />;
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
