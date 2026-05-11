import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Float, Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { LanguageStat } from "../hooks/useLanguageMastery";
import { getLanguageColor } from "../utils/languages";

/* ─── layout: arrange stars in a flat ring constellation ─── */
function layoutStars(data: LanguageStat[]) {
  const maxMastery = Math.max(...data.map((d) => d.mastery), 1);

  return data.map((stat, i) => {
    const normalizedMastery = stat.mastery / maxMastery;

    // Primary language at center, others in a ring around it
    let x: number, y: number, z: number;

    if (i === 0) {
      // Primary language: center with slight float
      x = 0;
      y = 0;
      z = 0;
    } else {
      // Concentric ring layout — inner ring for top languages, outer for less used
      const ringIndex = i <= 4 ? 0 : 1;
      const ringRadius = ringIndex === 0 ? 2.2 : 3.4;
      const itemsInRing = ringIndex === 0 ? Math.min(data.length - 1, 4) : data.length - 5;
      const indexInRing = ringIndex === 0 ? i - 1 : i - 5;
      const angleOffset = ringIndex === 0 ? Math.PI / 6 : 0; // stagger rings
      const angle =
        angleOffset + (indexInRing / Math.max(itemsInRing, 1)) * Math.PI * 2;

      x = ringRadius * Math.cos(angle);
      y = (Math.random() - 0.5) * 0.4; // slight vertical variation
      z = ringRadius * Math.sin(angle);
    }

    const starSize = i === 0 ? 0.32 : 0.1 + normalizedMastery * 0.18;

    return {
      ...stat,
      position: [x, y, z] as [number, number, number],
      size: starSize,
      normalizedMastery,
      color: getLanguageColor(stat.language),
    };
  });
}

/* ─── Constellation Lines ─── */
function ConstellationLines({
  stars,
}: {
  stars: ReturnType<typeof layoutStars>;
}) {
  const lineGeom = useMemo(() => {
    const points: THREE.Vector3[] = [];

    // Connect center star to inner ring
    if (stars.length > 1) {
      const center = new THREE.Vector3(...stars[0].position);
      for (let i = 1; i < Math.min(stars.length, 5); i++) {
        points.push(center.clone(), new THREE.Vector3(...stars[i].position));
      }
    }

    // Connect adjacent stars in each ring
    const innerRing = stars.slice(1, 5);
    for (let i = 0; i < innerRing.length; i++) {
      const next = (i + 1) % innerRing.length;
      points.push(
        new THREE.Vector3(...innerRing[i].position),
        new THREE.Vector3(...innerRing[next].position)
      );
    }

    const outerRing = stars.slice(5);
    for (let i = 0; i < outerRing.length; i++) {
      const next = (i + 1) % outerRing.length;
      points.push(
        new THREE.Vector3(...outerRing[i].position),
        new THREE.Vector3(...outerRing[next].position)
      );
    }

    // Connect some outer to nearest inner
    for (const outer of outerRing) {
      let minDist = Infinity;
      let nearest: THREE.Vector3 | null = null;
      const op = new THREE.Vector3(...outer.position);
      for (const inner of innerRing) {
        const ip = new THREE.Vector3(...inner.position);
        const d = op.distanceTo(ip);
        if (d < minDist) {
          minDist = d;
          nearest = ip;
        }
      }
      if (nearest && minDist < 4) {
        points.push(op, nearest);
      }
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [stars]);

  return (
    <lineSegments geometry={lineGeom}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.08}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* ─── Individual Star ─── */
interface StarInfo {
  language: string;
  bytes: number;
  repoCount: number;
  color: string;
  mastery: number;
}

function Star({
  position,
  size,
  color,
  language,
  mastery,
  bytes,
  repoCount,
  onHover,
  onUnhover,
  isHovered,
  isPrimary,
}: {
  position: [number, number, number];
  size: number;
  color: string;
  language: string;
  mastery: number;
  bytes: number;
  repoCount: number;
  onHover: (info: StarInfo) => void;
  onUnhover: () => void;
  isHovered: boolean;
  isPrimary: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringsRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Pulse
    const pulse = 1 + Math.sin(t * 1.5 + mastery * 10) * 0.08;
    const scale = isHovered ? size * 1.5 : size * pulse;
    meshRef.current.scale.setScalar(scale);

    if (glowRef.current) {
      const glowScale = isHovered ? scale * 5 : scale * 3.5;
      glowRef.current.scale.setScalar(glowScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isHovered
        ? 0.12 + Math.sin(t * 3) * 0.03
        : 0.05;
    }

    // Rotate rings for primary star
    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.3;
      ringsRef.current.rotation.x = Math.PI / 3;
    }
  });

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover({ language, bytes, repoCount, color, mastery });
    },
    [language, bytes, repoCount, color, mastery, onHover]
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onUnhover();
    },
    [onUnhover]
  );

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orbit ring for primary star */}
      {isPrimary && (
        <mesh ref={ringsRef}>
          <torusGeometry args={[size * 5, 0.015, 8, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Core star */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <icosahedronGeometry args={[1, isPrimary ? 3 : 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 2 : isPrimary ? 1.2 : 0.7}
          roughness={0.15}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, size * 2.5 + 0.25, 0]}
        fontSize={isPrimary ? 0.26 : 0.16}
        color={isHovered ? "#ffffff" : isPrimary ? "#e4e4e7" : "#71717a"}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.025}
        outlineColor="#000000"
      >
        {language}
      </Text>

      {/* Percentage label for top stars */}
      {isPrimary && (
        <Text
          position={[0, -(size * 2.5 + 0.15), 0]}
          fontSize={0.14}
          color="#52525b"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Primary Language
        </Text>
      )}
    </group>
  );
}

/* ─── Background star dust ─── */
function StarDust({ count = 300 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 20
      );
      dummy.scale.setScalar(0.003 + Math.random() * 0.012);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const brightness = 0.2 + Math.random() * 0.6;
      color.setRGB(brightness, brightness, brightness * 1.1);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.003;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ─── Scene ─── */
function ConstellationScene({
  data,
  hoveredStar,
  setHoveredStar,
}: {
  data: LanguageStat[];
  hoveredStar: StarInfo | null;
  setHoveredStar: (info: StarInfo | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const stars = useMemo(() => layoutStars(data), [data]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.03;
  });

  const handleUnhover = useCallback(
    () => setHoveredStar(null),
    [setHoveredStar]
  );

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      <pointLight
        position={[-4, -2, 4]}
        intensity={0.3}
        color="#3b82f6"
        distance={15}
      />
      <pointLight
        position={[2, 3, -4]}
        intensity={0.2}
        color="#a78bfa"
        distance={12}
      />

      <Float speed={0.4} rotationIntensity={0} floatIntensity={0.1}>
        <group ref={groupRef}>
          <ConstellationLines stars={stars} />
          {stars.map((star, i) => (
            <Star
              key={star.language}
              position={star.position}
              size={star.size}
              color={star.color}
              language={star.language}
              mastery={star.normalizedMastery}
              bytes={star.bytes}
              repoCount={star.repoCount}
              onHover={setHoveredStar}
              onUnhover={handleUnhover}
              isHovered={hoveredStar?.language === star.language}
              isPrimary={i === 0}
            />
          ))}
        </group>
      </Float>

      <StarDust />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </>
  );
}

/* ─── Helpers ─── */
function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

/* ─── Export ─── */
export function SkillConstellation({ data }: { data: LanguageStat[] }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<StarInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        No language data available.
      </div>
    );
  }

  const totalBytes = data.reduce((s, d) => s + d.bytes, 0);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-2">
        <div>
          <span className="text-sm font-medium text-[var(--text)]">
            Skill Constellation
          </span>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            {data.length} languages across {formatBytes(totalBytes)} of code
          </p>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          All time · drag to explore
        </span>
      </div>

      {/* 3D Canvas */}
      <div className="relative h-[400px] w-full cursor-grab active:cursor-grabbing">
        {isVisible ? (
          <Canvas
            camera={{
              position: [0, 2, 7],
              fov: 48,
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
            <ConstellationScene
              data={data}
              hoveredStar={hoveredStar}
              setHoveredStar={setHoveredStar}
            />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            Loading constellation…
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredStar && (
          <div className="pointer-events-none absolute left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/90 px-4 py-2.5 backdrop-blur-sm shadow-lg">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-white/10"
              style={{ backgroundColor: hoveredStar.color }}
            />
            <div>
              <div className="text-xs font-medium text-[var(--text)]">
                {hoveredStar.language}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {formatBytes(hoveredStar.bytes)} · {hoveredStar.repoCount}{" "}
                {hoveredStar.repoCount === 1 ? "repo" : "repos"} ·{" "}
                {((hoveredStar.bytes / totalBytes) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Edge gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--surface)] to-transparent" />
      </div>

      {/* Legend bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[var(--border-subtle)] px-5 py-3">
        {data.map((stat) => {
          const pct = ((stat.bytes / totalBytes) * 100).toFixed(1);
          return (
            <div
              key={stat.language}
              className={`flex items-center gap-1.5 text-[10px] transition-opacity ${hoveredStar && hoveredStar.language !== stat.language ? "opacity-40" : ""}`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: getLanguageColor(stat.language) }}
              />
              <span className="text-[var(--text-secondary)]">
                {stat.language}
              </span>
              <span className="tabular-nums text-[var(--text-muted)]">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
