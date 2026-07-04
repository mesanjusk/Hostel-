"use client";

import { motion, AnimatePresence } from "framer-motion";

/** A rough, slightly-irregular square checkbox with a hand-drawn cherry-red tick
 * that draws itself in via an SVG pathLength sweep, echoing a pen stroke on paper. */
export function HandDrawnCheckbox({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-pressed={checked}
      aria-label={label ?? (checked ? "Mark as not packed" : "Mark as packed")}
      whileTap={{ scale: 0.82 }}
      animate={checked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative flex size-6 shrink-0 items-center justify-center border-[2.25px] border-[#3a2e2a]/60 bg-white/70"
      style={{ borderRadius: "3px 7px 5px 6px" }}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            viewBox="0 0 20 20"
            className="absolute inset-0 h-full w-full p-[3px]"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.path
              d="M3.5 10.5c1.6 1.8 3 3.3 3.9 4.3 2.4-3.6 5.2-7.3 9-10.8"
              fill="none"
              stroke="#c0392b"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1 },
              }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
