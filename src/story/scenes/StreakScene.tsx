import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";

export function StreakScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  const showActive = insights.currentStreak > 0;
  const headline = showActive ? insights.currentStreak : insights.longestStreak;
  const label = showActive ? "day streak, still going." : "day streak, your longest.";
  const subline = showActive
    ? `Longest run this year: ${insights.longestStreak} days.`
    : `${insights.activeDays} active days across the year.`;

  return (
    <SceneShell>
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ color: palette.primary }}
      >
        <Flame size={96} />
      </motion.div>
      <div
        className="mt-4 text-[18vw] font-semibold leading-none tracking-tight sm:text-[14vw] md:text-[10rem]"
        style={{ color: "#fff", textShadow: `0 0 80px ${palette.primary}66` }}
      >
        <CountUp value={headline} duration={1.4} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="mt-4 text-xl text-white/80"
      >
        {label}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="mt-2 text-sm text-white/40"
      >
        {subline}
      </motion.div>
    </SceneShell>
  );
}
