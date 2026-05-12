import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthSpan {
  month: number;
  startCol: number;
  endCol: number;
}

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
  const labelBand = 38;
  const ruleY = labelBand - 6;
  const gridHeight = 7 * stride;
  const height = labelBand + gridHeight;

  const max = Math.max(...entries.map(([, v]) => v), 1);

  // Group columns by month so the label sits centered on each month's span
  // instead of pinned to where the month happens to start.
  const spans: MonthSpan[] = [];
  for (let col = 0; col < totalWeeks; col++) {
    const idx = col * 7;
    if (idx >= entries.length) break;
    const [dateStr] = entries[idx];
    const month = new Date(dateStr + "T00:00:00Z").getUTCMonth();
    const last = spans[spans.length - 1];
    if (last && last.month === month) last.endCol = col;
    else spans.push({ month, startCol: col, endCol: col });
  }

  // The past year wraps from e.g. May → May. Drop whichever instance has the
  // smaller span so the surviving label is the meaningful one.
  if (spans.length > 1 && spans[0].month === spans[spans.length - 1].month) {
    const first = spans[0];
    const last = spans[spans.length - 1];
    const firstCols = first.endCol - first.startCol + 1;
    const lastCols = last.endCol - last.startCol + 1;
    if (firstCols >= lastCols) spans.pop();
    else spans.shift();
  }

  // Estimate label width and suppress any label that would collide with the
  // next one — this keeps very narrow months (1 column wide at year edges)
  // from crashing into their neighbors.
  const approxLabelWidth = 28; // px in viewBox units, for "MMM" at fontSize 11 + tracking
  const visible = spans.map((s, i) => {
    const cx = (s.startCol + s.endCol) * stride * 0.5 + cellSize / 2;
    const next = spans[i + 1];
    const nextCx = next
      ? (next.startCol + next.endCol) * stride * 0.5 + cellSize / 2
      : Infinity;
    const minGap = approxLabelWidth + 4;
    return { ...s, cx, suppressed: nextCx - cx < minGap };
  });

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
      <div className="mt-12 w-full max-w-[1100px] overflow-hidden">
        <svg
          viewBox={`0 0 ${gridWidth} ${height}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          {visible.map((s, i) => {
            if (s.suppressed) return null;
            return (
              <motion.text
                key={`${s.month}-${s.startCol}`}
                x={s.cx}
                y={labelBand - 16}
                textAnchor="middle"
                initial={reducedMotion ? false : { opacity: 0, y: labelBand - 20 }}
                animate={{ opacity: 0.78, y: labelBand - 16 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.3 + i * 0.05,
                  duration: 0.5,
                }}
                style={{
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fill: "rgba(255,255,255,0.92)",
                }}
              >
                {MONTH_ABBR[s.month]}
              </motion.text>
            );
          })}

          {/* Hairline between labels and grid for clearer separation */}
          <motion.line
            x1={0}
            x2={gridWidth}
            y1={ruleY}
            y2={ruleY}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          />

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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40"
      >
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 0.3, 0.55, 0.8, 1].map((alpha, i) => (
            <span
              key={i}
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{
                background: alpha === 0 ? "#1a1a24" : palette.primary,
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
