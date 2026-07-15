import { lazy, Suspense } from "react";

const Suitcase3DCanvas = lazy(() => import("@/features/bags/suitcase-3d-canvas"));

interface Suitcase3DProps {
  color: string;
  open?: boolean;
  interactive?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/** Flat-color placeholder shown instantly while the three.js chunk streams in, so the bags
 * list/detail pages never block on ~250kb of @react-three/fiber + drei + three. */
function SuitcaseFallback({ color, size = 140, className, onClick }: Suitcase3DProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        cursor: onClick ? "pointer" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: "62%",
          height: "48%",
          borderRadius: "14%",
          background: color,
          opacity: 0.85,
        }}
      />
    </div>
  );
}

export function Suitcase3D(props: Suitcase3DProps) {
  return (
    <Suspense fallback={<SuitcaseFallback {...props} />}>
      <Suitcase3DCanvas {...props} />
    </Suspense>
  );
}
