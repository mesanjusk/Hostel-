import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, Phone, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandName } from "@/components/shared/brand-name";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/lib/api";
import { normalizeMobile } from "@/lib/phone";
import type { UserDTO } from "@/types";

// The bot's WhatsApp number this page sends the pre-filled message to.
const BOT_WHATSAPP_NUMBER = "919370195000";
// Post-login landing hub for this flow specifically — distinct from the main app's
// HOME_ROUTE, which registrations reach later via onboarding as normal.
const WA_LOGIN_HOME_ROUTE = "/wa-login/home";
const POLL_INTERVAL_MS = 3000;

type WaLoginMode = "register" | "resend";

type StatusResponse =
  | { status: "pending" }
  | { status: "registered"; token: string; user: UserDTO; suggestedName: string | null; mode: WaLoginMode }
  | { status: "expired" };

export function WaLoginForm() {
  const navigate = useNavigate();
  const { checkMobile, login, loginWithToken } = useAuth();

  const [step, setStep] = useState<"mobile" | "action">("mobile");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<WaLoginMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const pendingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!waLink || !pendingIdRef.current) return;

    const interval = setInterval(async () => {
      try {
        const result = await api.get<StatusResponse>(`/api/wa-register/status?pendingId=${pendingIdRef.current}`);
        if (result.status === "registered") {
          clearInterval(interval);
          loginWithToken(result.token, result.user);
          toast.success(result.mode === "resend" ? "You're logged in!" : "You're registered!");
          navigate(result.mode === "resend" ? WA_LOGIN_HOME_ROUTE : "/onboarding", {
            replace: true,
            state: { suggestedName: result.suggestedName ?? undefined, viaWaLogin: true },
          });
        } else if (result.status === "expired") {
          clearInterval(interval);
          setError("This attempt expired. Please start again.");
          setStep("mobile");
          setWaLink(null);
        }
      } catch {
        // Transient network hiccups during polling aren't worth surfacing — the next tick retries.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [waLink, loginWithToken, navigate]);

  async function handleGo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setIsCheckingMobile(true);
    try {
      const exists = await checkMobile(mobile);
      setMode(exists ? "resend" : "register");
      setStep("action");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsCheckingMobile(false);
    }
  }

  async function handleClickToRegister() {
    setError(null);

    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number");
      setStep("mobile");
      return;
    }
    if (mode === "register" && !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setIsRegistering(true);
    try {
      const result = await api.post<{ pendingId: string; mode: WaLoginMode }>("/api/wa-register/start", {
        mobile,
        pin: mode === "register" ? pin : "0000",
      });
      pendingIdRef.current = result.pendingId;
      setMode(result.mode);

      const message =
        result.mode === "resend"
          ? `PACKWITHME Send my code for ${normalized.slice(2)}`
          : `PACKWITHME Register me as ${normalized.slice(2)}, my PIN is ${pin}`;
      const link = `https://wa.me/${BOT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      setWaLink(link);

      const opened = window.open(link, "_blank", "noopener,noreferrer");
      setPopupBlocked(!opened);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleDirectLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError("Enter your 4-digit code");
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(mobile, pin);
      toast.success("You're logged in!");
      navigate(WA_LOGIN_HOME_ROUTE, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Try again, or tap \"Get code\" below.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleBack() {
    setStep("mobile");
    setMode(null);
    setPin("");
    setWaLink(null);
    setPopupBlocked(false);
    setError(null);
  }

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={64} height={64} />
        <h1 className="text-2xl">
          <BrandName />
        </h1>
      </div>

      {step === "mobile" ? (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleGo}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="wa-mobile">Mobile number</Label>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <Input
                id="wa-mobile"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                className="pl-11"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" size="lg" disabled={isCheckingMobile} className="mt-2">
            {isCheckingMobile ? <Loader2 className="size-4 animate-spin" /> : null}
            Go
          </Button>
        </motion.form>
      ) : mode === "resend" ? (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleDirectLogin}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="wa-login-code">Enter your 4-digit code</Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <Input
                id="wa-login-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="1234"
                className="pl-11 tracking-widest"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" size="lg" disabled={isLoggingIn} className="mt-2">
            {isLoggingIn ? <Loader2 className="size-4 animate-spin" /> : null}
            Enter
          </Button>
          <button
            type="button"
            disabled={isRegistering}
            onClick={handleClickToRegister}
            className="text-foreground text-center text-sm font-medium underline underline-offset-4 disabled:opacity-50"
          >
            {isRegistering ? "Sending..." : "Click to Get Code"}
          </button>
          {popupBlocked && waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground text-center text-xs underline underline-offset-4"
            >
              WhatsApp didn't open — tap here
            </a>
          )}
          <Button type="button" variant="ghost" onClick={handleBack}>
            Back
          </Button>
        </motion.form>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="wa-pin">Choose a 4-digit PIN</Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <Input
                id="wa-pin"
                inputMode="numeric"
                autoComplete="off"
                placeholder="1234"
                className="pl-11 tracking-widest"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="button"
            size="lg"
            disabled={isRegistering}
            className="mt-2 bg-[#25D366] hover:bg-[#1ebe57]"
            onClick={handleClickToRegister}
          >
            {isRegistering ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            Click to Register
          </Button>
          {popupBlocked && waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground text-center text-xs underline underline-offset-4"
            >
              WhatsApp didn't open — tap here
            </a>
          )}
          <Button type="button" variant="ghost" onClick={handleBack}>
            Back
          </Button>
        </motion.div>
      )}
    </div>
  );
}
