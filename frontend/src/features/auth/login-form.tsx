import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandName } from "@/components/shared/brand-name";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { HOME_ROUTE } from "@/lib/nav-items";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(mobile, pin);
      const from = (location.state as { from?: Location })?.from?.pathname ?? HOME_ROUTE;
      navigate(from, { replace: true });
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

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={64} height={64} />
        <h1 className="text-2xl">
          <BrandName />
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your mobile number and login code.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onSubmit={handleSubmit}
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
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pin-code">Login code</Label>
          <div className="relative">
            <KeyRound className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <Input
              id="pin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="7-digit code"
              className="pl-11 tracking-widest"
              maxLength={7}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Log in
        </Button>
      </motion.form>
    </div>
  );
}
