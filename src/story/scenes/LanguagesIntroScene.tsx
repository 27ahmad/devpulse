import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";
import { getLanguageColor } from "../../utils/languages";

export function LanguagesIntroScene({ ctx }: { ctx: SceneContext }) {
  const { insights, languages, palette } = ctx;
  const top = languages.slice(0, 6);
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        You spoke
      </motion.div>
      <div
        className="mt-4 text-[18vw] font-semibold leading-none sm:text-[14vw] md:text-[12rem]"
        style={{ color: palette.primary, textShadow: `0 0 80px ${palette.primary}55` }}
      >
        <CountUp value={insights.languagesUsedCount} duration={1.2} />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-2 text-xl text-white/70"
      >
        languages this year.
      </motion.div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {top.map((l, i) => (
          <motion.div
            key={l.language}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.1, duration: 0.5 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getLanguageColor(l.language) }}
            />
            {l.language}
          </motion.div>
        ))}
      </div>
    </SceneShell>
  );
}
