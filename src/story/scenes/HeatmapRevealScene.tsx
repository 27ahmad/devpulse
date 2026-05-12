import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function HeatmapRevealScene({ ctx }: { ctx: SceneContext }) {
  const { contributions, palette, reducedMotion } = ctx;
  const entries = Object.entries(contributions.dailyContributions).sort(
    ([a], [b]) => a.localeCompare(b)
  );
  if (entries.length === 0) return null;

  const cellSize = 12;
  const gap = 3;
  const stride = cellSize + gap;
  const totalWeeks = Math.ceil(entries.length / 7);
  const gridWidth = totalWeeks * stride;
  const labelBand = 18;
  const gridHeight = 7 * stride;
  const height = labelBand + gridHeight;

  const max = Math.max(...entries.map(([, v]) => v), 1);

  // Walk columns and stamp a month label the first time we encounter a
  // new month. We use UTC parsing because date strings are ISO-formatted
  // YYYY-MM-DD without time, so local parsing can drift by a day near
  // month boundaries depending on the user's timezone.
  const monthMarks: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (let col = 0; col < totalWeeks; col++) {
    const idx = col * 7;
    if (idx >= entries.length) break;
    const [dateStr] = entries[idx];
    const month = new Date(dateStr + "T00:00:00Z").getUTCMonth();
    if (month !== lastMonth) {
      monthMarks.push({ col, label: MONTH_ABBR[month] });
      lastMonth = month;
    }
  }

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
          viewBox={`0 0 ${gridWidth} ${height}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Month labels — only render where there's room (skip the very
              last mark if it would collide with the right edge). */}
          {monthMarks.map(({ col, label }, i) => {
            const next = monthMarks[i + 1];
            const room = (next ? next.col : totalWeeks) - col;
            if (room < 2) return null;
            return (
              <motion.text
                key={`${label}-${col}`}
                x={col * stride}
                y={labelBand - 6}
                initial={reducedMotion ? false : { opacity: 0, y: labelBand - 10 }}
                animate={{ opacity: 0.55, y: labelBand - 6 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.3 + i * 0.05,
                  duration: 0.5,
                }}
                style={{
                  fontFamily: "inherit",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fill: "rgba(255,255,255,0.85)",
                }}
              >
                {label}
              </motion.text>
            );
          })}

          {entries.map(([date, count], i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            const intensity = count === 0 ? 0 : 0.25 + (count / max) * 0.75;
            const x = col * stride;
            const y = labelBand + row * stride;
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
                  delay: reducedMotion ? 0 : Math.min(0.4 + col * 0.012, 3.2),
                  duration: 0.4,
                }}
                style={{ transformOrigin: `${x + cellSize / 2}px ${y + cellSize / 2}px` }}
              />
            );
          })}
        </svg>
      </div>

      {/* Activity-level legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40"
      >
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 0.3, 0.55, 0.8, 1].map((alpha, i) => (
            <span
              key={i}
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{
                background:
                  alpha === 0 ? "#1a1a24" : palette.primary,
                opacity: alpha === 0 ? 1 : alpha,
              }}
            />
          ))}
        </div>
        <span>More</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.6 }}
        className="mt-6 text-2xl font-semibold text-white"
      >
        {ctx.insights.consistency}%{" "}
        <span className="font-normal text-white/60">of weeks had activity.</span>
      </motion.div>
    </SceneShell>
  );
}
