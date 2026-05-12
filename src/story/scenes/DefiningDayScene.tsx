import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CountUp, CharReveal } from "./sceneShared";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DefiningDayScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  if (!insights.bestDay) return null;

  // ISO dates ("YYYY-MM-DD") parsed naively land in UTC; pull the parts directly
  // so we don't print "March 13" for an entry tagged March 14.
  const [yStr, mStr, dStr] = insights.bestDay.date.split("-");
  const dateObj = new Date(
    parseInt(yStr, 10),
    parseInt(mStr, 10) - 1,
    parseInt(dStr, 10)
  );
  const dayName = DAY_NAMES[dateObj.getDay()];
  const monthName = MONTH_NAMES[dateObj.getMonth()];
  const dayOfMonth = dateObj.getDate();

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        One day in particular
      </motion.div>

      <h1
        className="mt-8 text-6xl font-semibold leading-none tracking-tight sm:text-8xl md:text-[9rem]"
        style={{ color: palette.accent, textShadow: `0 0 80px ${palette.accent}55` }}
      >
        <CharReveal text={`${monthName} ${dayOfMonth}`} staggerPerChar={0.05} />
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="mt-6 text-xl uppercase tracking-[0.3em] text-white/50 sm:text-2xl"
      >
        {dayName}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="mt-10 flex items-baseline gap-3"
      >
        <span className="text-5xl font-semibold tabular-nums text-white sm:text-6xl">
          <CountUp value={insights.bestDay.count} duration={1.2} />
        </span>
        <span className="text-base text-white/60">
          contributions in a single day.
        </span>
      </motion.div>
    </SceneShell>
  );
}
