import { motion } from "framer-motion";

interface FillIconProps {
  value: number;
  size?: number;
}

/** A suitcase silhouette that fills from the bottom like liquid as packing progress rises. */
export function SuitcaseFill({ value, size = 120 }: FillIconProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const bodyTop = 26;
  const bodyBottom = 90;
  const bodyHeight = bodyBottom - bodyTop;
  const fillY = bodyBottom - (clamped / 100) * bodyHeight;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <clipPath id="suitcase-clip">
          <rect x="12" y={bodyTop} width="76" height={bodyHeight} rx="12" />
        </clipPath>
        <linearGradient id="suitcase-fill-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      <path
        d="M40 26 V17 a10 10 0 0 1 20 0 V26"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      <rect x="12" y={bodyTop} width="76" height={bodyHeight} rx="12" className="fill-muted" />

      <g clipPath="url(#suitcase-clip)">
        <motion.rect
          x="12"
          width="76"
          height={bodyHeight}
          fill="url(#suitcase-fill-gradient)"
          initial={{ y: bodyBottom }}
          animate={{ y: fillY }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </g>

      <line
        x1="12"
        y1={(bodyTop + bodyBottom) / 2}
        x2="88"
        y2={(bodyTop + bodyBottom) / 2}
        stroke="var(--card)"
        strokeWidth="2"
        opacity="0.7"
      />
      <rect x="32" y={(bodyTop + bodyBottom) / 2 - 5} width="9" height="9" rx="2" fill="var(--card)" opacity="0.7" />
      <rect x="59" y={(bodyTop + bodyBottom) / 2 - 5} width="9" height="9" rx="2" fill="var(--card)" opacity="0.7" />

      <rect
        x="12"
        y={bodyTop}
        width="76"
        height={bodyHeight}
        rx="12"
        fill="none"
        stroke="var(--foreground)"
        strokeOpacity="0.12"
        strokeWidth="2.5"
      />
    </svg>
  );
}

/** A piggy bank silhouette that fills from the bottom like liquid as budget spend rises. */
export function PiggyBankFill({ value, size = 120 }: FillIconProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const cx = 46;
  const cy = 56;
  const rx = 34;
  const ry = 26;
  const bodyTop = cy - ry;
  const bodyBottom = cy + ry;
  const fillY = bodyBottom - (clamped / 100) * (bodyBottom - bodyTop);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <clipPath id="piggy-clip">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <linearGradient id="piggy-fill-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--secondary)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>

      {/* legs */}
      {[24, 40, 54, 68].map((x) => (
        <rect key={x} x={x} y={78} width="7" height="10" rx="3" className="fill-muted" />
      ))}

      {/* ear */}
      <path d="M24 32 L16 20 L32 26 Z" className="fill-muted" />

      {/* snout */}
      <ellipse cx={80} cy={58} rx={9} ry={7} className="fill-muted" />
      <circle cx={77} cy={58} r={1.4} fill="var(--foreground)" opacity="0.3" />
      <circle cx={83} cy={58} r={1.4} fill="var(--foreground)" opacity="0.3" />

      {/* body */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="fill-muted" />

      <g clipPath="url(#piggy-clip)">
        <motion.rect
          x={cx - rx}
          width={rx * 2}
          height={ry * 2}
          fill="url(#piggy-fill-gradient)"
          initial={{ y: bodyBottom }}
          animate={{ y: fillY }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </g>

      {/* coin slot */}
      <rect x={cx - 8} y={bodyTop - 2} width="16" height="4" rx="2" fill="var(--foreground)" opacity="0.25" />

      {/* tail */}
      <path
        d="M12 46 q-6 -4 0 -8 q6 -4 -2 -8"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="var(--foreground)" strokeOpacity="0.12" strokeWidth="2.5" />
    </svg>
  );
}
