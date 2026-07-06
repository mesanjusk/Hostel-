import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HOME_ROUTE } from "@/lib/nav-items";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="gradient-brand flex size-16 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
        <Compass className="size-8 text-white" />
      </div>
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild size="lg">
        <Link to={HOME_ROUTE}>Back home</Link>
      </Button>
    </div>
  );
}
