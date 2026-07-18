import { Component, type ErrorInfo, type ReactNode } from "react";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Last-resort catch for render errors that survive lazyRetry's own reload-and-retry (e.g. the
 * server is still unreachable afterwards) — shows a retry prompt instead of an uncaught error
 * unmounting the whole app to a blank white screen. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="gradient-brand flex size-14 items-center justify-center rounded-2xl opacity-90 shadow-lg shadow-primary/20">
          <WifiOff className="size-7 text-white" />
        </div>
        <div>
          <p className="font-display font-semibold">Couldn't reach the server</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Check your connection and try again.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }
}
