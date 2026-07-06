import { SplashScreen } from "@/components/shared/splash-screen";
import { MoodboardView } from "@/features/welcome/moodboard-view";

export default function WelcomePage() {
  return (
    <>
      <SplashScreen />
      <MoodboardView />
    </>
  );
}
