import { motion } from "framer-motion";
import type { SceneContext } from "../types";
import { SceneShell } from "./sceneShared";

export function OpeningScene({ ctx }: { ctx: SceneContext }) {
  const { user, palette } = ctx;
  return (
    <SceneShell>
      <motion.img
        src={user.avatar_url}
        alt={user.login}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="h-28 w-28 rounded-full"
        style={{ boxShadow: `0 0 60px ${palette.primary}44, 0 0 120px ${palette.accent}33` }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="mt-6 text-sm uppercase tracking-[0.3em] text-white/60"
      >
        DevPulse
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="mt-2 text-4xl font-semibold text-white"
      >
        @{user.login}
      </motion.div>
    </SceneShell>
  );
}
