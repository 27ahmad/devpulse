import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

const SkillConstellation = lazy(() =>
  import("../../components/SkillConstellation").then((m) => ({
    default: m.SkillConstellation,
  }))
);

export function ConstellationScene({ ctx }: { ctx: SceneContext }) {
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        Mapped to the sky
      </motion.div>
      <div className="mt-4 w-full max-w-5xl">
        <Suspense
          fallback={
            <div className="flex h-[400px] items-center justify-center text-xs text-white/40">
              Charting stars…
            </div>
          }
        >
          <SkillConstellation data={ctx.languages} />
        </Suspense>
      </div>
    </SceneShell>
  );
}
