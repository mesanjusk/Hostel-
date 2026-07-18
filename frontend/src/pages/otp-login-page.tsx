import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandName } from "@/components/shared/brand-name";
import { useAuth } from "@/context/auth-context";
import { trackRegistrationPageOpened } from "@/lib/analytics/client";
import { msg91Configured, retryOtp, sendOtp, verifyOtp } from "@/lib/msg91";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Passwordless login/registration via the MSG91 "Login with OTP" widget (same widget as the
 * WhatsLocal project). Mobile → OTP → verify → session. First time for a number registers it
 * and the app then routes to onboarding; a returning number just logs in. The reactive
 * AuthOnlyRoute guard wrapping this route is the authority on where a successful sign-in lands
 * (onboarding for new users, /home for returning ones), so we don't navigate manually
 * on success — see components/protected-route.tsx.
 */
export default function OtpLoginPage() {
  const navigate = useNavigate();
  const { loginWithWidget } = useAuth();

  const [step, setStep] = useState<0 | 1>(0);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    trackRegistrationPageOpened();
  }, []);

  // Ticks the resend cooldown down to 0 for as long as we're on the OTP-entry step; harmless
  // no-op renders once it hits 0 (React bails out on same-value state updates).
  useEffect(() => {
    if (step !== 1) return;
    const id = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendOtp(mobile);
      setSent(true);
      setStep(1);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || isResending) return;
    setError(null);
    setIsResending(true);
    try {
      await retryOtp();
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const accessToken = await verifyOtp(otp);
      await loginWithWidget(accessToken);
      // AuthOnlyRoute reactively redirects on the user-state change (and wins the race), but
      // navigate home as a harmless fallback in case this page is ever rendered ungated.
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={64} height={64} />
        <h1 className="text-2xl">
          <BrandName />
        </h1>
        <p className="text-muted-foreground text-sm">
          {step === 0 ? "Enter your mobile number to log in or sign up" : `Enter the code sent to ${mobile}`}
        </p>
      </div>

      {!msg91Configured ? (
        <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border px-3 py-2.5 text-sm">
          OTP login isn't configured. Set <code>VITE_MSG91_WIDGET_ID</code> and{" "}
          <code>VITE_MSG91_TOKEN_AUTH</code> and rebuild.
        </div>
      ) : step === 0 ? (
        <motion.form
          id="register-form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSend}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="mobile">Mobile number</Label>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <Input
                id="mobile"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                className="pl-11"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || mobile.replace(/\D/g, "").length < 10}
            className="mt-2"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            Send code
          </Button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleVerify}
          className="flex flex-col gap-4"
        >
          <div className="border-primary/20 bg-primary/5 text-foreground flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>We've sent a code to {mobile}. Enter it below to continue.</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="otp-code">Verification code</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter the code"
              className="tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="w-fit px-0"
              disabled={resendCooldown > 0 || isResending}
              onClick={handleResend}
            >
              {isResending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                "Resend code"
              )}
            </Button>
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting || otp.length < 4} className="mt-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Verify & continue
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep(0);
              setSent(false);
              setOtp("");
              setError(null);
            }}
          >
            Change number
          </Button>
        </motion.form>
      )}
    </div>
  );
}
