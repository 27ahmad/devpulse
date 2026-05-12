import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";

export function LinesChangedScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  const net = insights.prAdditions - insights.prDeletions;
  const sampleNote =
    insights.prSampleCount < insights.pullRequests
      ? ` Across your latest ${insights.prSampleCount} pull requests.`
      : "";

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        The diff
      </motion.div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-12">
        <Pillar
          color="#22c55e"
          sign="+"
          value={insights.prAdditions}
          label="added"
        />
        <div className="text-3xl text-white/30 sm:text-5xl">·</div>
        <Pillar
          color="#ef4444"
          sign="−"
          value={insights.prDeletions}
          label="deleted"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="mt-12 text-xl font-medium text-white sm:text-2xl"
      >
        <span className="text-white/60">Net: </span>
        <span style={{ color: net >= 0 ? "#22c55e" : "#ef4444" }}>
          {net >= 0 ? "+" : "−"}
          <CountUp value={Math.abs(net)} duration={1.3} />
        </span>
        <span className="text-white/60"> lines.</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="mt-3 text-xs uppercase tracking-[0.2em]"
        style={{ color: palette.accent }}
      >
        {insights.prChangedFiles.toLocaleString()} files touched.
        {sampleNote}
      </motion.div>
    </SceneShell>
  );
}

function Pillar({
  color,
  sign,
  value,
  label,
}: {
  color: string;
  sign: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="text-5xl font-semibold tabular-nums sm:text-7xl md:text-8xl"
        style={{ color, textShadow: `0 0 60px ${color}55` }}
      >
        {sign}
        <CountUp value={value} duration={1.6} />
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
        {label}
      </div>
    </div>
  );
}
