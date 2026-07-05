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

// DOM id the widget renders its captcha step into, if the widget has one enabled
// (Widget Settings in MSG91). Without a matching element present, a widget with
// captcha enabled can hang indefinitely instead of exposing sendOtp/verifyOtp.
const MSG91_CAPTCHA_ID = "msg91-captcha-box";

type WidgetStatus = "loading" | "ready" | "error";

const WIDGET_READY_TIMEOUT_MS = 12000;
const WIDGET_POLL_INTERVAL_MS = 250;

export function LoginForm() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("otp");
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasWidgetConfig = Boolean(MSG91_WIDGET_ID && MSG91_TOKEN_AUTH);
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>(
    hasWidgetConfig ? "loading" : "error",
  );
  const [widgetErrorReason, setWidgetErrorReason] = useState<string | null>(
    hasWidgetConfig
      ? null
      : "OTP widget isn't configured (missing widget ID/token auth in this deployment).",
  );
  const widgetInitCalled = useRef(false);

  function failWidget(reason: string) {
    setWidgetStatus("error");
    setWidgetErrorReason(reason);
  }

  useEffect(() => {
    if (!hasWidgetConfig) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    function waitForMethods() {
      // initSendOTP() fetches the widget's own config from MSG91 before exposing
      // sendOtp/verifyOtp on window, so they aren't available synchronously — poll
      // for them with a hard timeout rather than assuming they're ready right away.
      pollTimer = setInterval(() => {
        if (window.sendOtp) {
          if (pollTimer) clearInterval(pollTimer);
          if (timeoutTimer) clearTimeout(timeoutTimer);
          if (!cancelled) setWidgetStatus("ready");
        }
      }, WIDGET_POLL_INTERVAL_MS);

      timeoutTimer = setTimeout(() => {
        if (pollTimer) clearInterval(pollTimer);
        if (!cancelled && !window.sendOtp) {
          failWidget(
            "OTP widget script loaded but never became ready (double-check the Widget ID / Token Auth in MSG91).",
          );
        }
      }, WIDGET_READY_TIMEOUT_MS);
    }

    function initWidget() {
      if (widgetInitCalled.current || !window.initSendOTP) return;
      widgetInitCalled.current = true;
      window.initSendOTP({
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        exposeMethods: true,
        captchaRenderId: MSG91_CAPTCHA_ID,
        failure: (err) => {
          if (!cancelled) {
            failWidget(`MSG91 widget error: ${err?.message || "unknown error"}`);
          }
        },
      });
      waitForMethods();
    }

    if (window.sendOtp) {
      setWidgetStatus("ready");
      return;
    }

    if (window.initSendOTP) {
      initWidget();
      return () => {
        cancelled = true;
        if (pollTimer) clearInterval(pollTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
      };
    }

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
        if (!cancelled && urlIndex < MSG91_SCRIPT_URLS.length) {
          loadNext();
        } else if (!cancelled) {
          failWidget("Could not load the OTP script from MSG91 (network blocked, or an ad/script blocker).");
        }
      };
      document.head.appendChild(script);
    }

    loadNext();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [hasWidgetConfig]);

  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    if (widgetStatus !== "ready" || !window.sendOtp) {
      setError(
        widgetStatus === "error"
          ? (widgetErrorReason ?? "OTP service is unavailable right now.") +
              " You can use a login code instead."
          : "OTP service is still loading. Please wait a moment and try again.",
      );
      return;
    }

    // Present only when the widget's captcha step is enabled; absent (undefined) means
    // there's no captcha to solve, so treat that as verified.
    if (window.isCaptchaVerified && !window.isCaptchaVerified()) {
      setError("Please complete the verification above.");
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
                {!error && widgetStatus === "loading" && (
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Loader2 className="size-3 animate-spin" />
                    Preparing OTP service…
                  </p>
                )}
              </div>
              {/* MSG91 renders its captcha step here if one is enabled on the widget;
                  stays empty (and harmless) when captcha is disabled. */}
              <div id={MSG91_CAPTCHA_ID} className="empty:hidden" />
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || widgetStatus === "loading"}
                className="mt-2"
              >
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
