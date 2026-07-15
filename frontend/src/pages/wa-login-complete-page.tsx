import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import type { UserDTO } from "@/types";

// Post-login landing hub for this flow specifically — distinct from the main app's
// HOME_ROUTE, which registrations reach later via onboarding as normal.
const WA_LOGIN_HOME_ROUTE = "/wa-login/home";

type StatusResponse =
  | { status: "pending" }
  | { status: "registered"; token: string; user: UserDTO; suggestedName: string | null; mode: "register" | "resend" }
  | { status: "expired" };

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1500;

/** Landing page for the one-tap link the /wa-login WhatsApp bot sends back once a
 * registration or code-resend handshake completes — reuses the same status endpoint the
 * originating browser tab polls, so by the time a human taps this link the handshake is
 * already done and this just adopts the session and redirects in. */
export default function WaLoginCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const pendingId = searchParams.get("pendingId");
    if (!pendingId) {
      setError("This link is missing some information.");
      return;
    }

    let cancelled = false;

    async function poll(attempt: number) {
      try {
        const result = await api.get<StatusResponse>(`/api/wa-register/status?pendingId=${pendingId}`);
        if (cancelled) return;

        if (result.status === "registered") {
          loginWithToken(result.token, result.user);
          navigate(result.mode === "resend" ? WA_LOGIN_HOME_ROUTE : "/onboarding", {
            replace: true,
            state: { suggestedName: result.suggestedName ?? undefined, viaWaLogin: true },
          });
          return;
        }

        if (result.status === "expired" || attempt >= MAX_ATTEMPTS) {
          setError("This link has expired.");
          return;
        }

        setTimeout(() => poll(attempt + 1), RETRY_DELAY_MS);
      } catch (err) {
        if (cancelled) return;
        if (attempt >= MAX_ATTEMPTS) {
          setError(err instanceof ApiError ? err.message : "Something went wrong.");
          return;
        }
        setTimeout(() => poll(attempt + 1), RETRY_DELAY_MS);
      }
    }

    void poll(0);

    return () => {
      cancelled = true;
    };
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="glass relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-3xl p-8 text-center shadow-2xl">
      {error ? (
        <>
          <p className="text-destructive text-sm">{error}</p>
          <Link to="/login" className="text-foreground text-sm font-medium underline underline-offset-4">
            Go to login
          </Link>
        </>
      ) : (
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      )}
    </div>
  );
}
