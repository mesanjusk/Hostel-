import { OtpAuthForm } from "@/features/auth/otp-auth-form";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const { requestRegisterOtp, registerWithOtp } = useAuth();

  return (
    <OtpAuthForm
      heading="Send code"
      subheading="Enter your mobile number to get started. We'll text you a 6-digit code on WhatsApp — no password to set up."
      submitLabel="Create account"
      requestOtp={requestRegisterOtp}
      submit={registerWithOtp}
      footer={{ prompt: "Already have an account?", linkLabel: "Log in", linkTo: "/wa-login" }}
      isRegistration
    />
  );
}
