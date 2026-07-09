import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { HOME_ROUTE } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

type Step = "mobile" | "pin" | "otp";

/** Circular gradient-brand CTA — the "round design button" the pin/OTP steps submit with. */
function RoundSubmitButton({ label, loading }: { label: string; loading: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      aria-label={label}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="gradient-brand flex size-20 items-center justify-center rounded-full text-base font-bold text-white shadow-[0_14px_32px_-10px_rgba(201,107,154,0.65)] disabled:pointer-events-none disabled:opacity-60"
    >
      {loading ? <Loader2 className="size-5 animate-spin" /> : label}
    </motion.button>
  );
}

const STEP_TRANSITION = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, checkMobile, requestRegisterOtp, registerWithOtp } = useAuth();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [customPin, setCustomPin] = useState("");
  const [sendStatus, setSendStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goHome() {
    const from = (location.state as { from?: Location })?.from?.pathname ?? HOME_ROUTE;
    navigate(from, { replace: true });
  }

  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const exists = await checkMobile(mobile);
      if (exists) {
        setStep("pin");
      } else {
        const result = await requestRegisterOtp(mobile);
        if (result.devOtp) {
          toast.info(`Dev OTP: ${result.devOtp}`, { description: "WhatsApp send not confirmed" });
          setSendStatus({ ok: true, message: `Dev mode — your code is ${result.devOtp}` });
        } else if (result.sent) {
          setSendStatus({ ok: true, message: `We've sent a 6-digit code to ${mobile} on WhatsApp.` });
        } else {
          setSendStatus({
            ok: false,
            message: result.error ?? "Couldn't confirm the WhatsApp send — check your WhatsApp and try again.",
          });
        }
        setStep("otp");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(mobile, pin);
      goHome();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Invalid mobile number or code, or too many attempts. Please try again in a few minutes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await registerWithOtp(mobile, otp, customPin || undefined);
      goHome();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function backToMobile() {
    setStep("mobile");
    setError(null);
    setPin("");
    setOtp("");
    setCustomPin("");
    setSendStatus(null);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative w-full max-w-md overflow-hidden rounded-[28px] p-8 shadow-[0_30px_70px_-25px_rgba(58,46,42,0.4)] sm:p-10"
    >
      <div
        aria-hidden
        className="gradient-brand absolute inset-x-0 -top-24 mx-auto size-48 rounded-full opacity-20 blur-3xl"
      />

      <AnimatePresence mode="wait" initial={false}>
        {step === "mobile" && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={STEP_TRANSITION}
            className="relative"
          >
            <div className="mb-8 text-center">
              <h1
                className="text-[2rem] leading-[1.1] font-bold text-[#3a2e2a] sm:text-4xl"
                style={{ fontFamily: "var(--font-caveat-mood)" }}
              >
                Start your journey with <span className="text-gradient-brand">Pack with Me</span>
              </h1>
              <p className="text-muted-foreground mt-3 text-sm">It&apos;s completely free 🎉</p>
            </div>

            <form onSubmit={handleMobileSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile number</Label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                  <Input
                    id="mobile"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    className="h-12 pl-11 text-base"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="gradient-brand mt-2 flex h-12 items-center justify-center gap-2 rounded-full text-base font-semibold text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                Continue
              </button>
            </form>
          </motion.div>
        )}

        {step === "pin" && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={STEP_TRANSITION}
            className="relative"
          >
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl font-bold">Welcome back!</h2>
              <p className="text-muted-foreground mt-1 text-sm">Enter your login code for {mobile}</p>
            </div>

            <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-6">
              <Input
                id="pin-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                className="h-14 w-full max-w-[240px] text-center text-xl tracking-[0.5em]"
                maxLength={7}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
              {error && (
                <p className="text-destructive text-center text-sm" role="alert">
                  {error}
                </p>
              )}

              <RoundSubmitButton label="Go" loading={isSubmitting} />

              <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-center text-sm">
                <button type="button" onClick={backToMobile} className="underline underline-offset-4">
                  Use a different number
                </button>
                <Link to="/forgot-password" className="text-foreground font-medium underline underline-offset-4">
                  Forgot your login code?
                </Link>
              </div>
            </form>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={STEP_TRANSITION}
            className="relative"
          >
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl font-bold">Verify your WhatsApp</h2>
              <p className="text-muted-foreground mt-1 text-sm">Enter the code sent to {mobile}</p>
            </div>

            <form onSubmit={handleOtpSubmit} className="flex flex-col items-center gap-5">
              {sendStatus && (
                <div
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm",
                    sendStatus.ok
                      ? "border-primary/20 bg-primary/5 text-foreground"
                      : "border-destructive/20 bg-destructive/5 text-destructive",
                  )}
                >
                  {sendStatus.ok && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
                  <span>{sendStatus.message}</span>
                </div>
              )}

              <Input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                className="h-14 w-full max-w-[240px] text-center text-xl tracking-[0.5em]"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />

              <div className="grid w-full gap-2 text-left">
                <Label htmlFor="custom-pin">Set a login code for next time (optional)</Label>
                <Input
                  id="custom-pin"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Choose a 6-7 digit code"
                  className="h-12 tracking-widest"
                  maxLength={7}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ""))}
                />
                <p className="text-muted-foreground text-xs">
                  Skip this to use today&apos;s WhatsApp code as your login code instead.
                </p>
              </div>

              {error && (
                <p className="text-destructive text-center text-sm" role="alert">
                  {error}
                </p>
              )}

              <RoundSubmitButton label="Verify" loading={isSubmitting} />

              <button
                type="button"
                onClick={backToMobile}
                className="text-muted-foreground text-center text-sm underline underline-offset-4"
              >
                Use a different number
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
