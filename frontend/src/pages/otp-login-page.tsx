import { useNavigate } from "react-router-dom";

import { BrandName } from "@/components/shared/brand-name";
import { OtpLoginForm } from "@/features/auth/otp-login-form";

/**
 * Full-page OTP login for direct/bookmarked visits to /wa-login. Everywhere else in the app a
 * feature that needs a linked mobile number opens OtpLoginDialog in place instead of navigating
 * here (see protected-route.tsx's RequireIdentifiedRoute) — this page just wraps the same form.
 * The reactive AuthOnlyRoute guard wrapping this route is the authority on where a successful
 * sign-in lands (onboarding for new users, /home for returning ones), so the fallback navigate
 * below only matters if this page is ever rendered ungated.
 */
export default function OtpLoginPage() {
  const navigate = useNavigate();

  return (
    <div className="glass relative w-full max-w-md overflow-hidden rounded-[2rem] p-8 shadow-[0_25px_60px_-20px_var(--shadow-brand)]">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="" width={64} height={64} />
        <h1 className="text-2xl">
          <BrandName />
        </h1>
        <p className="text-muted-foreground text-sm">Enter your mobile number to log in or sign up</p>
      </div>
      <OtpLoginForm onSuccess={() => navigate("/", { replace: true })} />
    </div>
  );
}
