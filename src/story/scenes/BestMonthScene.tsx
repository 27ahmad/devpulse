import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CharReveal, CountUp } from "./sceneShared";

export function BestMonthScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  if (!insights.bestMonth) return null;
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        Your sharpest month
      </motion.div>
      <h1
        className="mt-6 text-7xl font-semibold leading-none sm:text-8xl md:text-[10rem]"
        style={{ color: palette.accent, textShadow: `0 0 80px ${palette.accent}55` }}
      >
        <CharReveal text={insights.bestMonth.label} staggerPerChar={0.06} />
      </h1>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="mt-6 text-3xl font-semibold text-white"
      >
        <CountUp value={insights.bestMonth.count} duration={1.2} />
        <span className="ml-2 text-white/60 font-normal text-xl">contributions.</span>
      </motion.div>
    </SceneShell>
  );
}
