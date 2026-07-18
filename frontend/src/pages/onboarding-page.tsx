import { useLocation } from "react-router-dom";

import { OnboardingForm } from "@/features/auth/onboarding-form";
import { readSelectedGender } from "@/lib/onboarding-gender";

export default function OnboardingPage() {
  // Set by the /wa-login/complete flow — prefills the name field with the visitor's
  // WhatsApp profile name.
  const location = useLocation();
  const state = location.state as { suggestedName?: string } | null;

  return <OnboardingForm defaultName={state?.suggestedName} initialGender={readSelectedGender()} />;
}
