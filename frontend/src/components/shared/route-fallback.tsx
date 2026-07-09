import { Loader2 } from "lucide-react";

/** Shown briefly while a lazy-loaded route chunk downloads. */
export function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="text-primary size-8 animate-spin" aria-label="Loading" />
    </div>
  );
}
