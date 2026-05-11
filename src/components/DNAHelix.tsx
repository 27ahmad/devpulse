import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";
import type { ContributionData } from "../hooks/useContributions";

/* ─── constants ─── */
const HELIX_RADIUS = 1.4;
const PITCH = 0.12; // vertical spacing per day
const TURNS_PER_DAY = 0.06; // how fast the helix twists
const RUNG_RADIUS = 0.035;
const STRAND_TUBE_RADIUS = 0.045;
const GLOW_COLORS = {
  none: new THREE.Color("#1a1a2e"),
  low: new THREE.Color("#14532d"),
  med: new THREE.Color("#15803d"),
  high: new THREE.Color("#22c55e"),
  max: new THREE.Color("#4ade80"),
};

function getActivityColor(count: number): THREE.Color {
  if (count === 0) return GLOW_COLORS.none;
  if (count <= 2) return GLOW_COLORS.low;
  if (count <= 5) return GLOW_COLORS.med;
  if (count <= 10) return GLOW_COLORS.high;
  return GLOW_COLORS.max;
}

/* ─── Helix Strands (two TubeGeometry curves) ─── */
function HelixStrand({
  offset,
  days,
  color,
}: {
  offset: number;
  days: number;
  color: string;
}) {
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < days; i++) {
      const t = i * TURNS_PER_DAY * Math.PI * 2 + offset;
      const y = i * PITCH;
      points.push(
        new THREE.Vector3(HELIX_RADIUS * Math.cos(t), y, HELIX_RADIUS * Math.sin(t))
      );
    }
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  }, [offset, days]);

  const tubeGeom = useMemo(
    () => new THREE.TubeGeometry(curve, days * 4, STRAND_TUBE_RADIUS, 8, false),
    [curve, days]
  );

  return (
    <mesh geometry={tubeGeom}>
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

/* ─── Instanced Rungs ─── */
function Rungs({ dailyData }: { dailyData: { date: string; count: number }[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = dailyData.length;

  const { matrices, colors } = useMemo(() => {
    const _matrices: THREE.Matrix4[] = [];
    const _colors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const t1 = i * TURNS_PER_DAY * Math.PI * 2;
      const t2 = t1 + Math.PI;
      const y = i * PITCH;

      const p1 = new THREE.Vector3(
        HELIX_RADIUS * Math.cos(t1),
        y,
        HELIX_RADIUS * Math.sin(t1)
      );
      const p2 = new THREE.Vector3(
        HELIX_RADIUS * Math.cos(t2),
        y,
        HELIX_RADIUS * Math.sin(t2)
      );

      // position at midpoint
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      dummy.position.copy(mid);

      // orient towards p2 from p1
      const dir = p2.clone().sub(p1).normalize();
      const quat = new THREE.Quaternion();
      quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      dummy.quaternion.copy(quat);

      // scale length to distance between strands
      const dist = p1.distanceTo(p2);
      dummy.scale.set(1, dist, 1);
      dummy.updateMatrix();

      _matrices.push(dummy.matrix.clone());

      // colour by activity
      const c = dailyData[i].count;
      tempColor.copy(getActivityColor(c));
      _colors.push(tempColor.clone());
    }

    return { matrices: _matrices, colors: _colors };
  }, [dailyData, count]);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      meshRef.current.setMatrixAt(i, matrices[i]);
      meshRef.current.setColorAt(i, colors[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [matrices, colors, count]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[RUNG_RADIUS, RUNG_RADIUS, 1, 6]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ─── Floating Particles for ambiance ─── */
function Particles({ count = 80, height }: { count?: number; height: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 6,
        Math.random() * height,
        (Math.random() - 0.5) * 6
      );
      dummy.scale.setScalar(0.01 + Math.random() * 0.03);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      color.setHSL(0.35, 0.8, 0.3 + Math.random() * 0.4);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, height]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.02;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        transparent
        opacity={0.6}
        emissive="#22c55e"
        emissiveIntensity={0.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ─── Scene with auto-rotation ─── */
function HelixScene({ dailyData }: { dailyData: { date: string; count: number }[] }) {
  const groupRef = useRef<THREE.Group>(null!);
  const days = dailyData.length;
  const totalHeight = days * PITCH;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.08;
  });

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, totalHeight * 0.5, 3]} intensity={0.6} color="#22c55e" distance={12} />
      <pointLight position={[0, totalHeight * 0.3, -3]} intensity={0.4} color="#3b82f6" distance={10} />

      {/* Helix group, centered vertically */}
      <Float speed={0.8} rotationIntensity={0} floatIntensity={0.3}>
        <group ref={groupRef} position={[0, -totalHeight * 0.5, 0]}>
          {/* Strand 1 – Commits (blue accent) */}
          <HelixStrand offset={0} days={days} color="#3b82f6" />
          {/* Strand 2 – Reviews/PRs (purple accent) */}
          <HelixStrand offset={Math.PI} days={days} color="#a78bfa" />
          {/* Day rungs */}
          <Rungs dailyData={dailyData} />
        </group>
      </Float>

      {/* Ambient particles */}
      <Particles height={totalHeight} />

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
    </>
  );
}

/* ─── Legend Row ─── */
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

/* ─── Exported Component ─── */
export function DNAHelix({ data }: { data: ContributionData }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort daily data chronologically
  const dailyData = useMemo(() => {
    return Object.entries(data.dailyContributions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [data.dailyContributions]);

  // Intersection observer for lazy rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (dailyData.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        No contribution data available.
      </div>
    );
  }

  const activeDays = dailyData.filter((d) => d.count > 0).length;
  const maxDay = dailyData.reduce(
    (best, d) => (d.count > best.count ? d : best),
    dailyData[0]
  );

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <div>
          <span className="text-sm font-medium text-[var(--text)]">
            Engineering DNA
          </span>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            Your contribution genome — {dailyData.length} days sequenced
          </p>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          {activeDays} active · peak {maxDay.count} on{" "}
          {new Date(maxDay.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="relative h-[380px] w-full cursor-grab active:cursor-grabbing">
        {isVisible ? (
          <Canvas
            camera={{
              position: [0, 0, 6],
              fov: 50,
              near: 0.1,
              far: 100,
            }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ background: "transparent" }}
          >
            <HelixScene dailyData={dailyData} />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            Loading 3D visualization…
          </div>
        )}

        {/* Gradient overlay at top and bottom */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface)] to-transparent" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3">
        <div className="flex items-center gap-4">
          <LegendItem color="#3b82f6" label="Commits strand" />
          <LegendItem color="#a78bfa" label="Reviews strand" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)]">Activity:</span>
          {[
            { c: "#1a1a2e", l: "None" },
            { c: "#14532d", l: "Low" },
            { c: "#15803d", l: "Med" },
            { c: "#22c55e", l: "High" },
            { c: "#4ade80", l: "Peak" },
          ].map((item) => (
            <span
              key={item.l}
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.c }}
              title={item.l}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
