import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";
import type { LanguageStat } from "../hooks/useLanguageMastery";
import { getLanguageColor } from "../utils/languages";

/* ─── layout: arrange stars in a 3D constellation ─── */
function layoutStars(data: LanguageStat[]) {
  const maxMastery = Math.max(...data.map((d) => d.mastery), 1);

  // Use a golden-angle spiral in 3D for even distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return data.map((stat, i) => {
    const t = i / Math.max(data.length - 1, 1);
    const radius = 1.8 + t * 1.2; // inner = most mastery
    const theta = goldenAngle * i;
    const phi = Math.acos(1 - 2 * ((i + 0.5) / data.length));

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) * 0.6; // flatten vertically
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const normalizedMastery = stat.mastery / maxMastery;
    const starSize = 0.08 + normalizedMastery * 0.2;

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

    // Connect stars that are close enough (like a real constellation)
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = new THREE.Vector3(...stars[i].position);
        const b = new THREE.Vector3(...stars[j].position);
        const dist = a.distanceTo(b);

        // Only connect relatively close stars
        if (dist < 3.5) {
          points.push(a, b);
        }
      }
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [stars]);

  return (
    <lineSegments geometry={lineGeom}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.06}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* ─── Individual Star ─── */
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
}: {
  position: [number, number, number];
  size: number;
  color: string;
  language: string;
  mastery: number;
  bytes: number;
  repoCount: number;
  onHover: (info: StarInfo | null) => void;
  onUnhover: () => void;
  isHovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    // subtle pulse
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + mastery * 10) * 0.05;
    const scale = isHovered ? size * 1.6 : size * pulse;
    meshRef.current.scale.setScalar(scale);

    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * (isHovered ? 4 : 3));
    }
  });

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover({ language, bytes, repoCount, color });
    },
    [language, bytes, repoCount, color, onHover]
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
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.15 : 0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Core star */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1.5 : 0.8}
          roughness={0.2}
          metalness={0.3}
          toneMapped={false}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, size * 3 + 0.15, 0]}
        fontSize={0.18}
        color={isHovered ? "#ffffff" : "#a1a1aa"}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {language}
      </Text>
    </group>
  );
}

/* ─── Background star dust ─── */
function StarDust({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16
      );
      dummy.scale.setScalar(0.005 + Math.random() * 0.015);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const brightness = 0.3 + Math.random() * 0.7;
      color.setRGB(brightness, brightness, brightness);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.005;
    meshRef.current.rotation.x = clock.elapsedTime * 0.003;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ─── Cursor handler for canvas ─── */
function Cursor() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const setCursor = (style: string) => {
      canvas.style.cursor = style;
    };
    const onOver = () => setCursor("pointer");
    const onOut = () => setCursor("grab");
    canvas.addEventListener("pointerover", onOver);
    canvas.addEventListener("pointerout", onOut);
    canvas.style.cursor = "grab";
    return () => {
      canvas.removeEventListener("pointerover", onOver);
      canvas.removeEventListener("pointerout", onOut);
    };
  }, [gl]);
  return null;
}

/* ─── Scene ─── */
interface StarInfo {
  language: string;
  bytes: number;
  repoCount: number;
  color: string;
}

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
    groupRef.current.rotation.y = clock.elapsedTime * 0.04;
  });

  const handleUnhover = useCallback(
    () => setHoveredStar(null),
    [setHoveredStar]
  );

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
      <pointLight
        position={[-3, -2, 4]}
        intensity={0.3}
        color="#3b82f6"
        distance={15}
      />

      <Float speed={0.5} rotationIntensity={0} floatIntensity={0.15}>
        <group ref={groupRef}>
          <ConstellationLines stars={stars} />
          {stars.map((star) => (
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
            />
          ))}
        </group>
      </Float>

      <StarDust />
      <Cursor />
    </>
  );
}

/* ─── Tooltip overlay ─── */
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
      <div className="relative h-[380px] w-full cursor-grab active:cursor-grabbing">
        {isVisible ? (
          <Canvas
            camera={{
              position: [0, 0, 6.5],
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
          <div className="pointer-events-none absolute left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/90 px-4 py-2.5 backdrop-blur-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: hoveredStar.color }}
            />
            <div>
              <div className="text-xs font-medium text-[var(--text)]">
                {hoveredStar.language}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {formatBytes(hoveredStar.bytes)} · {hoveredStar.repoCount}{" "}
                {hoveredStar.repoCount === 1 ? "repo" : "repos"}
              </div>
            </div>
          </div>
        )}

        {/* Edge gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--surface)] to-transparent" />
      </div>

      {/* Legend bar */}
      <div className="flex flex-wrap gap-3 border-t border-[var(--border-subtle)] px-5 py-3">
        {data.slice(0, 6).map((stat) => {
          const pct = ((stat.bytes / totalBytes) * 100).toFixed(1);
          return (
            <div
              key={stat.language}
              className="flex items-center gap-1.5 text-[10px]"
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
