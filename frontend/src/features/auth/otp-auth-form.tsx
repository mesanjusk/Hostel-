import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandName } from "@/components/shared/brand-name";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

interface OtpRequestResult {
  sent: boolean;
  error?: string | null;
  devOtp?: string;
}

interface OtpAuthFormProps {
  heading: string;
  subheading: string;
  submitLabel: string;
  pinLabel: string;
  requestOtp: (mobile: string) => Promise<OtpRequestResult>;
  submit: (mobile: string, code: string, pin: string) => Promise<void>;
  footer: { prompt: string; linkLabel: string; linkTo: string };
}

export function OtpAuthForm({
  heading,
  subheading,
  submitLabel,
  pinLabel,
  requestOtp,
  submit,
  footer,
}: OtpAuthFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await requestOtp(mobile);
      if (result.devOtp) {
        toast.info(`Dev OTP: ${result.devOtp}`, { description: "WhatsApp send not confirmed" });
      } else if (result.sent) {
        toast.success("Code sent on WhatsApp");
      } else if (result.error) {
        toast.error(result.error);
      }
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pin !== confirmPin) {
      setError("Login codes don't match");
      return;
    }

    setIsSubmitting(true);
    try {
      await submit(mobile, code, pin);
      navigate("/", { replace: true });
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
        <p className="text-muted-foreground text-sm">{step === 0 ? subheading : `Enter the code sent to ${mobile}`}</p>
      </div>

      {step === 0 ? (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleRequestOtp}
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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
            {heading}
          </Button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="otp-code">WhatsApp code</Label>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="tracking-widest"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-pin">{pinLabel}</Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <Input
                id="new-pin"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="7-digit code"
                className="pl-11 tracking-widest"
                maxLength={7}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-pin">Confirm login code</Label>
            <div className="relative">
              <KeyRound className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
              <Input
                id="confirm-pin"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="7-digit code"
                className="pl-11 tracking-widest"
                maxLength={7}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep(0)}>
            Back
          </Button>
        </motion.form>
      )}

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {footer.prompt}{" "}
        <Link to={footer.linkTo} className="text-foreground font-medium underline underline-offset-4">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
