import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function FabMenu() {
  const navigate = useNavigate();
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function spawnRipple(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    setRipples((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
  }

  function clearRipple(id: number) {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }

  function openMessages() {
    navigate("/chat");
  }

  const fabButton = (size: "sm" | "lg") => (
    <div className={cn("relative", size === "sm" && "-translate-y-2")}>
      <motion.button
        type="button"
        aria-label="Messages"
        onPointerDown={spawnRipple}
        onClick={openMessages}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "gradient-brand relative flex items-center justify-center overflow-hidden rounded-full text-white",
          size === "sm" ? "size-14" : "size-16",
        )}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            onAnimationEnd={() => clearRipple(r.id)}
            className="animate-fab-ripple pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
        <MessageCircle className={size === "sm" ? "size-6" : "size-7"} />
      </motion.button>
    </div>
  );

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center lg:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto relative">{fabButton("sm")}</div>
      </div>

      <div className="pointer-events-none fixed right-8 bottom-8 z-40 hidden lg:block">
        <div className="pointer-events-auto relative">{fabButton("lg")}</div>
      </div>
    </>
  );
}
