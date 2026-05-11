import { motion } from "framer-motion";
import { FolderGit2 } from "lucide-react";
import type { SceneContext } from "../types";
import { SceneShell, CountUp, CharReveal } from "./sceneShared";

export function HomeBaseScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  const home = insights.homeBase;
  if (!home || home.commits === 0) return null;

  const accent = home.primaryLanguageColor ?? palette.primary;

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50"
      >
        <FolderGit2 size={12} />
        Home base
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="mt-8 text-3xl font-medium tracking-tight text-white/40 sm:text-4xl"
      >
        {home.nameWithOwner.split("/")[0]}/
      </motion.div>

      <h1
        className="mt-1 text-5xl font-semibold leading-none tracking-tight sm:text-7xl md:text-8xl"
        style={{
          background: `linear-gradient(135deg, #fff, ${accent})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        <CharReveal text={home.nameWithOwner.split("/")[1] ?? home.nameWithOwner} staggerPerChar={0.05} />
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="mt-10 flex items-baseline gap-3"
      >
        <span className="text-5xl font-semibold tabular-nums text-white sm:text-6xl">
          <CountUp value={home.commits} duration={1.4} />
        </span>
        <span className="text-base text-white/60">
          {home.commits === 1 ? "commit" : "commits"} this year
        </span>
      </motion.div>

      {home.primaryLanguage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.3em]"
          style={{ color: accent }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }}
          />
          {home.primaryLanguage}
        </motion.div>
      )}
    </SceneShell>
  );
}
