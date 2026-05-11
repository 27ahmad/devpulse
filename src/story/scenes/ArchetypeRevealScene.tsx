import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CharReveal } from "./sceneShared";

export function ArchetypeRevealScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        Your archetype
      </motion.div>

      <h1
        className="mt-8 text-6xl font-semibold leading-tight sm:text-7xl md:text-[8rem]"
        style={{
          background: `linear-gradient(135deg, ${palette.accent}, ${palette.primary})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: `drop-shadow(0 0 40px ${palette.primary}55)`,
        }}
      >
        <CharReveal text={insights.archetype.name} staggerPerChar={0.08} />
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.7 }}
        className="mt-10 max-w-2xl text-lg text-white/75 sm:text-xl"
      >
        {insights.archetype.tagline}
      </motion.p>
    </SceneShell>
  );
}
