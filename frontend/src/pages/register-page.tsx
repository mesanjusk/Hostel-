import { OtpAuthForm } from "@/features/auth/otp-auth-form";
import { useAuth } from "@/context/auth-context";

export default function RegisterPage() {
  const { requestRegisterOtp, registerWithOtp } = useAuth();

  return (
    <OtpAuthForm
      heading="Send code"
      subheading="Enter your mobile number to get started."
      submitLabel="Create account"
      pinLabel="Choose a login code"
      requestOtp={requestRegisterOtp}
      submit={registerWithOtp}
      footer={{ prompt: "Already have an account?", linkLabel: "Log in", linkTo: "/login" }}
    />
  );
}
