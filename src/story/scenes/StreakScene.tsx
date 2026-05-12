import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";

export function StreakScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  const { currentStreak, longestStreak, activeDays } = insights;

  // Always lead with the most impressive number — usually the longest run.
  // Only swap to "still going" framing when the user is currently in (or
  // very close to) their personal best. Otherwise the headline becomes
  // misleading: "1 day streak, still going" buries a 47-day longest run.
  const stillGoing =
    currentStreak > 0 && currentStreak >= Math.max(longestStreak * 0.9, 5);

  const headline = stillGoing ? currentStreak : longestStreak;
  const headlineCopy = stillGoing
    ? "day streak, still going."
    : "days, your longest run.";

  let subline: string;
  if (stillGoing) {
    subline = `${activeDays} active days across the year.`;
  } else if (currentStreak > 0) {
    subline = `Currently on day ${currentStreak}.`;
  } else if (longestStreak >= 3) {
    subline = `${activeDays} active days across the year.`;
  } else {
    subline = `${activeDays} active days this year.`;
  }

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
        {headlineCopy}
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
