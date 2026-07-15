import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface SuitcaseModelProps {
  color: string;
  open: boolean;
  interactive: boolean;
}

/** A stylized, low-poly hardshell trolley suitcase built from primitives — no external
 * 3D asset or HDRI download, so it renders reliably offline. The front "lid" hinges open
 * on click/open state; hovering lifts and tilts the whole case slightly. */
function SuitcaseModel({ color, open, interactive }: SuitcaseModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const lidPivotRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const bodyColor = color;
  const lidColor = new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.18).getStyle();
  const trimColor = new THREE.Color(color).lerp(new THREE.Color("#000000"), 0.25).getStyle();

  useFrame((_state, delta) => {
    if (lidPivotRef.current) {
      const targetLidAngle = open ? -1.9 : 0;
      lidPivotRef.current.rotation.x = THREE.MathUtils.damp(
        lidPivotRef.current.rotation.x,
        targetLidAngle,
        6,
        delta,
      );
    }

    if (rootRef.current) {
      const active = interactive && hovered;
      rootRef.current.rotation.y = THREE.MathUtils.damp(
        rootRef.current.rotation.y,
        active ? 0.35 : 0,
        8,
        delta,
      );
      rootRef.current.rotation.z = THREE.MathUtils.damp(
        rootRef.current.rotation.z,
        active ? 0.05 : 0,
        8,
        delta,
      );
      rootRef.current.position.y = THREE.MathUtils.damp(
        rootRef.current.position.y,
        active ? 0.1 : 0,
        8,
        delta,
      );
    }
  });

  return (
    <group
      ref={rootRef}
      onPointerOver={() => interactive && setHovered(true)}
      onPointerOut={() => interactive && setHovered(false)}
    >
      {/* Ground shadow fake — a flat dark translucent disc, cheaper than real shadow maps. */}
      <mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} />
      </mesh>

      {/* Body (stationary shell) */}
      <RoundedBox args={[1.4, 0.9, 0.55]} radius={0.08} smoothness={4} position={[0, -0.2, 0]}>
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.15} />
      </RoundedBox>

      {/* Zip/trim seam */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.42, 0.035, 0.57]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>

      {/* Telescoping handle (stationary, mounted on the body) */}
      <mesh position={[-0.42, 0.62, -0.2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color={trimColor} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.42, 0.62, -0.2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color={trimColor} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.86, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        <meshStandardMaterial color={trimColor} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Wheels */}
      {[-0.6, 0.6].map((x) =>
        [-0.24, 0.24].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.64, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 12]} />
            <meshStandardMaterial color="#2b2b33" roughness={0.6} />
          </mesh>
        )),
      )}

      {/* Lid (hinged at the back-top edge) */}
      <group ref={lidPivotRef} position={[0, 0.28, -0.275]}>
        <RoundedBox
          args={[1.4, 0.35, 0.55]}
          radius={0.08}
          smoothness={4}
          position={[0, 0.175, 0.275]}
        >
          <meshStandardMaterial color={lidColor} roughness={0.35} metalness={0.15} />
        </RoundedBox>
        {/* Top carry grip */}
        <mesh position={[0, 0.38, 0.02]}>
          <boxGeometry args={[0.32, 0.06, 0.08]} />
          <meshStandardMaterial color={trimColor} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

interface Suitcase3DCanvasProps {
  color: string;
  open?: boolean;
  interactive?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/** The actual three.js scene — split out from suitcase-3d.tsx so it can be lazy-loaded.
 * @react-three/fiber, @react-three/drei and three together add ~250kb gzipped; that's too
 * heavy to eagerly ship on every visit to the bags list/detail pages just for a decoration. */
export default function Suitcase3DCanvas({
  color,
  open = false,
  interactive = true,
  size = 140,
  className,
  onClick,
}: Suitcase3DCanvasProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [2.1, 1.5, 2.6], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        <Suspense fallback={null}>
          <SuitcaseModel color={color} open={open} interactive={interactive} />
        </Suspense>
      </Canvas>
    </div>
  );
}
