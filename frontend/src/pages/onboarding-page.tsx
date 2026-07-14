import { useLocation } from "react-router-dom";

import { OnboardingForm } from "@/features/auth/onboarding-form";

export default function OnboardingPage() {
  // Set by the /wa-login flow so the name field starts prefilled with the visitor's
  // WhatsApp profile name — they can still edit it before submitting.
  const location = useLocation();
  const suggestedName = (location.state as { suggestedName?: string } | null)?.suggestedName;

  return <OnboardingForm defaultName={suggestedName} />;
}
