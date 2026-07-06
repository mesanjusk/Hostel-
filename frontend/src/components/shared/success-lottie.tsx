import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export function SuccessLottie({ size = 64 }: { size?: number }) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/lottie/success-burst.json")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        // Animation is a decorative enhancement — fail silently if it can't load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) return null;

  return (
    <div style={{ width: size, height: size }}>
      <Lottie animationData={animationData} loop={false} />
    </div>
  );
}
