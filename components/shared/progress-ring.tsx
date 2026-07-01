"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressRing({ value, size = 140, strokeWidth = 12, label }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="fill-none"
          stroke="url(#progress-ring-gradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progress-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="55%" stopColor="var(--secondary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold">{Math.round(clamped)}%</span>
        {label && <span className="text-muted-foreground text-xs">{label}</span>}
      </div>
    </div>
  );
}
