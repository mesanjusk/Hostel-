import { motion } from "framer-motion";

interface SuitcaseIconProps {
  color: string;
  open?: boolean;
  interactive?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

function hexToRgb(hex: string) {
  const value = parseInt(hex.replace("#", ""), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** Blends `hex` toward `target` by `amount` (0-1) — used to derive the lighter lid
 * shade and the darker trim shade from a single bag color. */
function mix(hex: string, target: string, amount: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const r = Math.round(a.r + (b.r - a.r) * amount);
  const g = Math.round(a.g + (b.g - a.g) * amount);
  const bl = Math.round(a.b + (b.b - a.b) * amount);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** A flat CSS/SVG stand-in for the previous three.js suitcase — same lid-opens feel via
 * a `framer-motion` rotateX + perspective flip, but with no WebGL context or per-frame
 * render loop, so it's cheap to render dozens of these in the bags list. */
export function SuitcaseIcon({
  color,
  open = false,
  interactive = true,
  size = 140,
  className,
  onClick,
}: SuitcaseIconProps) {
  const lidColor = mix(color, "#ffffff", 0.32);
  const trimColor = mix(color, "#000000", 0.3);

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size, cursor: onClick ? "pointer" : undefined, perspective: size * 2.5 }}
      onClick={onClick}
      whileHover={interactive ? { y: -4, rotate: 2 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative size-full">
        {/* Ground shadow */}
        <div
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2 rounded-full bg-black/15"
          style={{ width: "58%", height: "8%" }}
        />

        {/* Wheels */}
        {["18%", "82%"].map((left) => (
          <div
            key={left}
            className="absolute bottom-[10%] size-[8%] rounded-full"
            style={{ left, backgroundColor: trimColor, transform: "translateX(-50%)" }}
          />
        ))}

        {/* Handle */}
        <div
          className="absolute left-1/2 top-[6%] rounded-full"
          style={{ width: "26%", height: "8%", backgroundColor: trimColor, transform: "translateX(-50%)" }}
        />

        {/* Body */}
        <div
          className="absolute bottom-[14%] left-[10%] right-[10%] rounded-2xl shadow-sm"
          style={{ height: "46%", backgroundColor: color }}
        >
          <div className="absolute inset-x-0 top-[28%] h-[7%]" style={{ backgroundColor: trimColor, opacity: 0.6 }} />
        </div>

        {/* Lid, hinged at the bottom edge so it flips back like a trunk opening */}
        <motion.div
          className="absolute left-[10%] right-[10%] rounded-t-2xl shadow-sm"
          style={{
            bottom: "60%",
            height: "22%",
            backgroundColor: lidColor,
            transformOrigin: "bottom center",
          }}
          animate={{ rotateX: open ? -125 : 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
        />
      </div>
    </motion.div>
  );
}
