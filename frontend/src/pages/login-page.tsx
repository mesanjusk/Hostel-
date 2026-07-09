import { LoginForm } from "@/features/auth/login-form";
import { PremiumAuthBackground } from "@/components/shared/premium-auth-background";

export default function LoginPage() {
  return (
    <>
      <PremiumAuthBackground />
      <LoginForm />
    </>
  );
}
