"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Phone, ArrowLeft, Loader2, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandName } from "@/components/shared/brand-name";
import { PinLoginForm } from "@/features/auth/pin-login-form";
import { HOME_ROUTE } from "@/lib/nav-items";
import { normalizeMobile } from "@/lib/phone";

type Step = "mobile" | "otp" | "verified";
type Method = "otp" | "code";

const MSG91_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ?? "";
const MSG91_TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH ?? "";

// MSG91 serves the widget script from two mirrors; fall back to the second if the
// first is unreachable (matches the loader snippet from the MSG91 widget dashboard).
const MSG91_SCRIPT_URLS = [
  "https://verify.msg91.com/otp-provider.js",
  "https://verify.phone91.com/otp-provider.js",
];

export function LoginForm() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("otp");
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const widgetReady = useRef(false);

  useEffect(() => {
    function initWidget() {
      if (widgetReady.current || !window.initSendOTP) return;
      window.initSendOTP({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        exposeMethods: true,
      });
      widgetReady.current = true;
    }

    if (window.initSendOTP) {
      initWidget();
      return;
    }

    let cancelled = false;
    let urlIndex = 0;

    function loadNext() {
      const script = document.createElement("script");
      script.src = MSG91_SCRIPT_URLS[urlIndex];
      script.async = true;
      script.onload = () => {
        if (!cancelled) initWidget();
      };
      script.onerror = () => {
        urlIndex += 1;
        if (!cancelled && urlIndex < MSG91_SCRIPT_URLS.length) loadNext();
      };
      document.head.appendChild(script);
    }

    loadNext();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    if (!window.sendOtp) {
      setError("OTP service isn't ready yet. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    window.sendOtp(
      normalized,
      (data) => {
        setIsSubmitting(false);
        setReqId(data.message);
        setStep("otp");
      },
      (err) => {
        setIsSubmitting(false);
        setError(err?.message || "Could not send OTP. Please try again.");
      },
    );
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!window.verifyOtp) {
      setError("OTP service isn't ready yet. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    window.verifyOtp(
      otp,
      async (data) => {
        setStep("verified");

        const signInResult = await signIn("msg91-otp", {
          accessToken: data.message,
          redirect: false,
        });

        setIsSubmitting(false);

        if (signInResult?.error) {
          toast.error("Could not complete sign-in. Please try again.");
          setStep("otp");
          return;
        }

        router.push(HOME_ROUTE);
        router.refresh();
      },
      (err) => {
        setIsSubmitting(false);
        setError(err?.message || "Incorrect code. Please try again.");
      },
      reqId ?? undefined,
    );
  }

  function handleResend() {
    if (!window.retryOtp) return;
    setError(null);
    window.retryOtp(
      null,
      (data) => setReqId(data.message),
      (err) => setError(err?.message || "Could not resend OTP."),
      reqId ?? undefined,
    );
  }

  function handleBack() {
    setStep("mobile");
    setOtp("");
    setReqId(null);
    setError(null);
  }

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="" width={64} height={64} priority />
        <h1 className="text-2xl">
          <BrandName />
        </h1>
        <p className="text-muted-foreground text-sm">
          {method === "otp"
            ? "No passwords. Log in instantly with an OTP."
            : "Enter your mobile number and login code."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {method === "code" ? (
          <motion.div
            key="code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <PinLoginForm />
            <button
              type="button"
              onClick={() => setMethod("otp")}
              className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Use OTP instead
            </button>
          </motion.div>
        ) : (
          step === "mobile" && (
            <motion.form
              key="mobile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleMobileSubmit}
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
              <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Send OTP
              </Button>
              <button
                type="button"
                onClick={() => setMethod("code")}
                className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 text-sm transition-colors"
              >
                <KeyRound className="size-3.5" />
                Have a login code instead?
              </button>
            </motion.form>
          )
        )}

        {step === "otp" && (
          <motion.form
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleOtpSubmit}
            className="flex flex-col items-center gap-5"
          >
            <ShieldCheck className="text-primary size-10" />
            <p className="text-muted-foreground text-center text-sm">
              Enter the OTP sent to your mobile number
            </p>
            <div className="grid w-full gap-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify OTP
            </Button>
            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={handleResend}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Use a different number
              </button>
            </div>
          </motion.form>
        )}

        {step === "verified" && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <CheckCircle2 className="text-success size-14" />
            <p className="font-medium">Verified! Taking you in…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
