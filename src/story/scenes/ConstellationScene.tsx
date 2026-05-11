import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";
import { getLanguageColor } from "../../utils/languages";

interface Segment {
  language: string;
  pct: number;
  color: string;
  bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function ConstellationScene({ ctx }: { ctx: SceneContext }) {
  const { languages, palette, insights } = ctx;

  const totalBytes = languages.reduce((s, l) => s + l.bytes, 0);
  if (totalBytes === 0 || languages.length === 0) return null;

  // Roll up the tail so the beam stays legible. Anything < 2% goes into "Other".
  const significant: Segment[] = [];
  let other = 0;
  for (const l of languages) {
    const pct = l.bytes / totalBytes;
    if (pct >= 0.02) {
      significant.push({
        language: l.language,
        pct,
        color: getLanguageColor(l.language),
        bytes: l.bytes,
      });
    } else {
      other += l.bytes;
    }
  }
  if (other / totalBytes >= 0.01) {
    significant.push({
      language: "Other",
      pct: other / totalBytes,
      color: "#52525b",
      bytes: other,
    });
  }

  const stagger = 0.14;
  const beamRise = 0.4;

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-xs uppercase tracking-[0.4em] text-white/50"
      >
        Your languages, mixed
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl"
      >
        <CountUp value={insights.languagesUsedCount} duration={1.2} /> languages,
        <br />
        <span className="text-white/60 font-normal">
          {formatBytes(totalBytes)} of code.
        </span>
      </motion.div>

      {/* The Beam */}
      <div className="mt-12 w-full max-w-[1100px] px-4">
        <motion.div
          initial={{ scaleY: 0.15, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: beamRise, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ transformOrigin: "center" }}
          className="relative flex h-24 w-full overflow-hidden rounded-xl sm:h-40 sm:rounded-2xl"
        >
          {/* Backdrop sheen */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.3))`,
            }}
          />

          {significant.map((seg, i) => (
            <motion.div
              key={seg.language}
              initial={{ width: "0%" }}
              animate={{ width: `${seg.pct * 100}%` }}
              transition={{
                delay: beamRise + 0.5 + i * stagger,
                duration: 0.9,
                ease: [0.2, 0.7, 0.2, 1],
              }}
              className="relative h-full overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${seg.color} 0%, ${seg.color}cc 100%)`,
                boxShadow:
                  i === 0
                    ? `inset 0 0 60px ${seg.color}66, 0 0 40px ${seg.color}55`
                    : `inset 0 0 30px ${seg.color}44`,
              }}
            >
              {/* Sheen highlight */}
              <div
                className="absolute inset-x-0 top-0 h-1/3"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)",
                }}
              />

              {/* Inline label for wide enough segments */}
              {seg.pct >= 0.12 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: beamRise + 0.9 + i * stagger,
                    duration: 0.5,
                  }}
                  className="relative flex h-full flex-col items-center justify-center px-2 text-center"
                >
                  <div
                    className="truncate text-sm font-semibold leading-tight sm:text-lg"
                    style={{
                      color: "#0a0a0a",
                      textShadow: "0 1px 0 rgba(255,255,255,0.25)",
                      maxWidth: "100%",
                    }}
                  >
                    {seg.language}
                  </div>
                  <div
                    className="text-[10px] font-medium tabular-nums sm:text-xs"
                    style={{ color: "rgba(0,0,0,0.6)" }}
                  >
                    {(seg.pct * 100).toFixed(seg.pct >= 0.1 ? 0 : 1)}%
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Legend strip — covers narrow segments that didn't get inline labels */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: beamRise + 1.6, duration: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          {significant.map((seg) => (
            <div
              key={seg.language}
              className="flex items-center gap-2 text-xs text-white/70"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: seg.color,
                  boxShadow: `0 0 12px ${seg.color}88`,
                }}
              />
              <span className="font-medium text-white/90">{seg.language}</span>
              <span className="tabular-nums text-white/50">
                {(seg.pct * 100).toFixed(seg.pct >= 0.1 ? 0 : 1)}%
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footnote: ties the visual back to the story palette */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: beamRise + 2.2, duration: 0.6 }}
        className="mt-10 text-[11px] uppercase tracking-[0.3em]"
        style={{ color: palette.accent }}
      >
        {insights.primaryLanguage
          ? `${insights.primaryLanguage} carried the year`
          : "A year in many tongues"}
      </motion.div>
    </SceneShell>
  );
}
