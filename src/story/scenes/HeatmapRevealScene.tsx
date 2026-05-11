import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

export function HeatmapRevealScene({ ctx }: { ctx: SceneContext }) {
  const { contributions, palette, reducedMotion } = ctx;
  const entries = Object.entries(contributions.dailyContributions).sort(
    ([a], [b]) => a.localeCompare(b)
  );
  if (entries.length === 0) return null;

  // Group into 7 rows x N cols (weekday rows)
  const cellSize = 12;
  const gap = 3;
  const totalWeeks = Math.ceil(entries.length / 7);
  const width = totalWeeks * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        Every cell, a day you showed up
      </motion.div>
      <div className="mt-10 w-full max-w-[1100px] overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          {entries.map(([date, count], i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            const intensity = count === 0 ? 0 : 0.25 + (count / max) * 0.75;
            const x = col * (cellSize + gap);
            const y = row * (cellSize + gap);
            return (
              <motion.rect
                key={date}
                x={x}
                y={y}
                rx={2}
                width={cellSize}
                height={cellSize}
                fill={count === 0 ? "#1a1a24" : palette.primary}
                initial={reducedMotion ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: intensity || 1, scale: 1 }}
                transition={{
                  delay: reducedMotion ? 0 : Math.min(col * 0.012, 2.8),
                  duration: 0.4,
                }}
                style={{ transformOrigin: `${x + cellSize / 2}px ${y + cellSize / 2}px` }}
              />
            );
          })}
        </svg>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.6 }}
        className="mt-8 text-2xl font-semibold text-white"
      >
        {ctx.insights.consistency}%{" "}
        <span className="font-normal text-white/60">of weeks had activity.</span>
      </motion.div>
    </SceneShell>
  );
}
