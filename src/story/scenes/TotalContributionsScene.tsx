import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";

export function TotalContributionsScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        You showed up
      </motion.div>
      <div
        className="mt-6 text-[18vw] font-semibold leading-none tracking-tight sm:text-[14vw] md:text-[12rem]"
        style={{ color: palette.primary, textShadow: `0 0 80px ${palette.primary}55` }}
      >
        <CountUp value={insights.totalContributions} duration={2} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="mt-4 text-lg text-white/70"
      >
        contributions this year.
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="mt-2 text-sm text-white/40"
      >
        Across {insights.activeDays} active days.
      </motion.div>
    </SceneShell>
  );
}
