import { OtpAuthForm } from "@/features/auth/otp-auth-form";
import { useAuth } from "@/context/auth-context";

export default function ForgotPasswordPage() {
  const { requestResetOtp, resetWithOtp } = useAuth();

  return (
    <OtpAuthForm
      heading="Send code"
      subheading="Enter your registered mobile number to reset your login code."
      submitLabel="Reset code & log in"
      pinLabel="New login code"
      requestOtp={requestResetOtp}
      submit={resetWithOtp}
      footer={{ prompt: "Remembered it?", linkLabel: "Log in", linkTo: "/login" }}
    />
  );
}
