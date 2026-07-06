"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ShieldAlert } from "lucide-react";

import { HOME_ROUTE } from "@/lib/nav-items";

function DevLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const secret = searchParams.get("secret");

    if (!secret) {
      setStatus("error");
      return;
    }

    signIn("msg91-otp", { devSecret: secret, redirect: false }).then((result) => {
      if (result?.error) {
        setStatus("error");
        return;
      }
      router.push(HOME_ROUTE);
      router.refresh();
    });
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="text-destructive size-10" />
        <p className="font-medium">Dev login failed</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Missing or incorrect secret, or <code>DEV_LOGIN_SECRET</code> isn&apos;t set on the
          server. This link only works while that environment variable is configured.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  );
}

export default function DevLoginPage() {
  return (
    <Suspense>
      <DevLoginInner />
    </Suspense>
  );
}
