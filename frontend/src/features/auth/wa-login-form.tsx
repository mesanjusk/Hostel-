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

// Experimental — kept off the live registration flow. The bot's WhatsApp number this
// page sends the pre-filled message to.
const BOT_WHATSAPP_NUMBER = "919370195000";
const POLL_INTERVAL_MS = 3000;

type StatusResponse =
  | { status: "pending" }
  | { status: "registered"; token: string; user: UserDTO; suggestedName: string | null }
  | { status: "expired" };

export function WaLoginForm() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [step, setStep] = useState<0 | 1>(0);
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (step !== 1 || !pendingIdRef.current) return;

    const interval = setInterval(async () => {
      try {
        const result = await api.get<StatusResponse>(
          `/api/wa-register/status?pendingId=${pendingIdRef.current}`,
        );
        if (result.status === "registered") {
          clearInterval(interval);
          loginWithToken(result.token, result.user);
          toast.success("You're registered!");
          navigate("/onboarding", { replace: true, state: { suggestedName: result.suggestedName ?? undefined } });
        } else if (result.status === "expired") {
          clearInterval(interval);
          setError("This registration attempt expired. Please start again.");
          setStep(0);
        }
      } catch {
        // Transient network hiccups during polling aren't worth surfacing — the next tick retries.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [step, loginWithToken, navigate]);

  async function handleGo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizeMobile(mobile);
    if (!normalized) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.post<{ pendingId: string }>("/api/wa-register/start", { mobile, pin });
      pendingIdRef.current = result.pendingId;

      const message = `Register me as ${normalized.slice(2)}, my PIN is ${pin}`;
      setWaLink(`https://wa.me/${BOT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`);
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
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
        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
          WhatsApp sign-up (test)
        </span>
        <p className="text-muted-foreground text-sm">
          {step === 0
            ? "Enter your mobile number and pick a 4-digit PIN, then confirm on WhatsApp."
            : "One more step — send the pre-filled message from your own WhatsApp."}
        </p>
      </div>

      {step === 0 ? (
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
              />
            </div>
            <p className="text-muted-foreground text-xs">You'll use this PIN to log in next time.</p>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Go
          </Button>
        </motion.form>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button asChild size="lg" className="mt-2 bg-[#25D366] hover:bg-[#1ebe57]">
            <a href={waLink ?? "#"} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Send on WhatsApp
            </a>
          </Button>
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Waiting for your WhatsApp message...
          </div>
          <Button type="button" variant="ghost" onClick={() => setStep(0)}>
            Back
          </Button>
        </motion.div>
      )}
    </div>
  );
}
