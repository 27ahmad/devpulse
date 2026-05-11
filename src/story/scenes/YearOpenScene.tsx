import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell, CharReveal } from "./sceneShared";

export function YearOpenScene({ ctx }: { ctx: SceneContext }) {
  const year = new Date().getFullYear();
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-xs uppercase tracking-[0.3em] text-white/50"
      >
        {year}, in 60 seconds
      </motion.div>
      <h1 className="mt-6 text-6xl font-semibold leading-tight text-white sm:text-7xl md:text-8xl">
        <CharReveal text="Your year" staggerPerChar={0.04} />
        <br />
        <CharReveal text="in code." delay={0.5} staggerPerChar={0.04} />
      </h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.6, duration: 0.7 }}
        className="mt-8 text-xs uppercase tracking-[0.3em] text-white/40"
      >
        for @{ctx.user.login}
      </motion.div>
    </SceneShell>
  );
}
