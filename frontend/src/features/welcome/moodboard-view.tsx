import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { HomeSectionCanvas } from "@/features/welcome/home-section-canvas";
import { HOME_SECTIONS } from "@/features/welcome/home-sections";
import { useHomeElements } from "@/features/welcome/use-home-elements";

export function MoodboardView() {
  const elements = useHomeElements();

  return (
    <div className="relative overflow-x-hidden bg-[#fdf6ee] text-[#3a2e2a]">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      {HOME_SECTIONS.map((section) => (
        <div key={section.id} id={section.id === "mental-prep" ? "mental-prep" : undefined} className="relative">
          <div className="block sm:hidden">
            <HomeSectionCanvas section={section} elements={elements} breakpoint="mobile" />
          </div>
          <div className="hidden sm:block">
            <HomeSectionCanvas section={section} elements={elements} breakpoint="desktop" />
          </div>
        </div>
      ))}

      {/* Persistent FAB — always reachable while scrolling the board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed right-5 bottom-5 z-50 sm:right-8 sm:bottom-8"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#3a2e2a] px-6 py-3.5 text-sm font-bold text-white shadow-[4px_6px_16px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:px-7 sm:py-4 sm:text-base"
        >
          Start Your Hostel Era ✨
        </Link>
      </motion.div>
    </div>
  );
}
