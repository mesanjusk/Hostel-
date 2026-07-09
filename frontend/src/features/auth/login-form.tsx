import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative w-full max-w-md overflow-hidden rounded-[28px] p-8 shadow-[0_30px_70px_-25px_rgba(58,46,42,0.4)] sm:p-10"
    >
      <div
        aria-hidden
        className="gradient-brand absolute inset-x-0 -top-24 mx-auto size-48 rounded-full opacity-20 blur-3xl"
      />

      <div className="relative mb-8 flex flex-col items-center gap-3 text-center">
        <div className="gradient-brand flex size-16 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
          <img src="/logo.png" alt="" width={40} height={40} />
        </div>
        <h1 className="font-display text-2xl font-bold">
          <BrandName />
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your mobile number and login code.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handleSubmit}
        className="relative flex flex-col gap-5"
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
              className="h-12 pl-11 text-base"
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
              placeholder="Your login code"
              className="h-12 pl-11 text-base tracking-widest"
              maxLength={7}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-sm"
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 h-12 text-base">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Log in
        </Button>
      </motion.form>

      <div className="text-muted-foreground relative mt-7 flex flex-col items-center gap-1.5 text-center text-sm">
        <p>
          New here?{" "}
          <Link to="/register" className="text-foreground font-medium underline underline-offset-4">
            Create an account
          </Link>
        </p>
        <p>
          <Link to="/forgot-password" className="text-foreground font-medium underline underline-offset-4">
            Forgot your login code?
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
