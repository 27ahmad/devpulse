import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CadenceScene({ ctx }: { ctx: SceneContext }) {
  const { insights, contributions, palette } = ctx;
  const max = Math.max(...contributions.dayOfWeekTotals, 1);

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        Your rhythm
      </motion.div>
      <div className="mt-10 flex items-end justify-center gap-2 sm:gap-5" style={{ height: 240 }}>
        {contributions.dayOfWeekTotals.map((v, i) => {
          const pct = (v / max) * 100;
          const isPeak = i === insights.peakDayIndex;
          return (
            <div key={i} className="flex w-9 flex-col items-center gap-3 sm:w-16">
              <div className="relative flex h-[200px] w-full items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.07, ease: [0.2, 0.7, 0.2, 1] }}
                  className="w-full rounded-md"
                  style={{
                    background: isPeak
                      ? `linear-gradient(180deg, ${palette.accent}, ${palette.primary})`
                      : "#23232c",
                    boxShadow: isPeak ? `0 0 40px ${palette.primary}55` : undefined,
                  }}
                />
              </div>
              <div
                className={`text-xs ${isPeak ? "font-medium text-white" : "text-white/40"}`}
              >
                {DAYS[i]}
              </div>
            </div>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="mt-10 text-2xl font-semibold text-white sm:text-3xl"
      >
        {insights.peakDay}s were yours.
      </motion.div>
    </SceneShell>
  );
}
