import { useLocation } from "react-router-dom";

import { OnboardingForm } from "@/features/auth/onboarding-form";

export default function OnboardingPage() {
  // Set by the /wa-login flow — prefills the name field with the visitor's WhatsApp
  // profile name, and routes onboarding completion to that flow's own landing hub
  // instead of the main app's HOME_ROUTE.
  const location = useLocation();
  const state = location.state as { suggestedName?: string; viaWaLogin?: boolean } | null;

  return <OnboardingForm defaultName={state?.suggestedName} viaWaLogin={state?.viaWaLogin} />;
}
