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
  const labelBand = 28;
  const gridHeight = 7 * stride;
  const height = labelBand + gridHeight;

  const max = Math.max(...entries.map(([, v]) => v), 1);

  // Group columns by month so we can center the month label across each
  // month's span instead of pinning it to the column where the month starts.
  // UTC parsing avoids the one-day drift that bites ISO date strings on
  // western timezones near month boundaries.
  const spans: MonthSpan[] = [];
  for (let col = 0; col < totalWeeks; col++) {
    const idx = col * 7;
    if (idx >= entries.length) break;
    const [dateStr] = entries[idx];
    const month = new Date(dateStr + "T00:00:00Z").getUTCMonth();
    const last = spans[spans.length - 1];
    if (last && last.month === month) {
      last.endCol = col;
    } else {
      spans.push({ month, startCol: col, endCol: col });
    }
  }

  // The past year wraps from e.g. May to May — drop the trailing slice if it
  // would duplicate the leading month and only spans a column or two, which
  // makes the label feel awkward at the right edge.
  if (
    spans.length > 1 &&
    spans[0].month === spans[spans.length - 1].month &&
    spans[spans.length - 1].endCol - spans[spans.length - 1].startCol < 2
  ) {
    spans.pop();
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
          {spans.map((s, i) => {
            // Center the label across the month's span. Drop sliver months
            // that don't have room to render readably.
            const cols = s.endCol - s.startCol + 1;
            if (cols < 2) return null;
            const cx = (s.startCol + s.endCol) * stride * 0.5 + cellSize / 2;
            return (
              <motion.text
                key={`${s.month}-${s.startCol}`}
                x={cx}
                y={labelBand - 12}
                textAnchor="middle"
                initial={reducedMotion ? false : { opacity: 0, y: labelBand - 16 }}
                animate={{ opacity: 0.7, y: labelBand - 12 }}
                transition={{
                  delay: reducedMotion ? 0 : 0.3 + i * 0.05,
                  duration: 0.5,
                }}
                style={{
                  fontFamily: "inherit",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fill: "rgba(255,255,255,0.85)",
                }}
              >
                {MONTH_ABBR[s.month]}
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
