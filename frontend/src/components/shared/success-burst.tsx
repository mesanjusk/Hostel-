/** Celebratory checkmark burst shown when a progress stat hits 100%. Pure CSS/SVG —
 * replaces the old lottie-react version, whose runtime alone added ~82 KB gzip to the
 * dashboard (and whose animation JSON was missing from /public, so it never played). */
export function SuccessBurst({ size = 64 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full overflow-visible">
        {/* Radiating burst rays */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={24 + Math.cos(angle) * 14}
              y1={24 + Math.sin(angle) * 14}
              x2={24 + Math.cos(angle) * 21}
              y2={24 + Math.sin(angle) * 21}
              stroke="#f2b03d"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="success-burst-ray"
            />
          );
        })}
        {/* Badge circle + drawn-on check */}
        <circle cx="24" cy="24" r="12" fill="#3fb96f" className="success-burst-badge" />
        <path
          d="M18.5 24.5 L22.5 28.5 L30 20.5"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="success-burst-check"
        />
      </svg>
      <style>{`
        .success-burst-badge {
          transform-origin: 24px 24px;
          animation: success-burst-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .success-burst-check {
          stroke-dasharray: 18;
          stroke-dashoffset: 18;
          animation: success-burst-draw 0.3s ease-out 0.25s forwards;
        }
        .success-burst-ray {
          transform-origin: 24px 24px;
          opacity: 0;
          animation: success-burst-rays 0.6s ease-out 0.35s both;
        }
        @keyframes success-burst-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes success-burst-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes success-burst-rays {
          0% { transform: scale(0.4); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .success-burst-badge, .success-burst-check, .success-burst-ray { animation: none; }
          .success-burst-check { stroke-dashoffset: 0; }
          .success-burst-ray { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
