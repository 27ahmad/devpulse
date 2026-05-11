import { motion } from "framer-motion";
import { GitCommit, GitPullRequest, Eye } from "lucide-react";
import type { SceneContext } from "../types";
import { SceneShell, CountUp } from "./sceneShared";

export function CollaborationScene({ ctx }: { ctx: SceneContext }) {
  const { insights, palette } = ctx;
  const total = insights.commits + insights.pullRequests + insights.reviews;
  const commitPct = total > 0 ? insights.commits / total : 1;
  const prPct = total > 0 ? insights.pullRequests / total : 0;
  const reviewPct = total > 0 ? insights.reviews / total : 0;

  const collabLabel =
    insights.collabShare >= 0.25
      ? "You were a teammate."
      : insights.collabShare < 0.05
        ? "Heads down, alone."
        : "Mostly solo, sometimes shared.";

  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-sm uppercase tracking-[0.3em] text-white/50"
      >
        How you worked
      </motion.div>

      <div className="mt-10 w-full max-w-3xl">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${commitPct * 100}%` }}
            transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ background: palette.primary }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${prPct * 100}%` }}
            transition={{ delay: 0.3, duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ background: palette.accent }}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${reviewPct * 100}%` }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ background: "#fff" }}
          />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6 text-center">
          <Stat icon={<GitCommit size={20} />} value={insights.commits} label="Commits" color={palette.primary} />
          <Stat icon={<GitPullRequest size={20} />} value={insights.pullRequests} label="PRs" color={palette.accent} />
          <Stat icon={<Eye size={20} />} value={insights.reviews} label="Reviews" color="#fff" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="mt-10 text-2xl font-semibold text-white sm:text-3xl"
      >
        {collabLabel}
      </motion.div>
    </SceneShell>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-center gap-2" style={{ color }}>
        {icon}
        <span className="text-3xl font-semibold tabular-nums">
          <CountUp value={value} duration={1.4} />
        </span>
      </div>
      <div className="mt-1 text-xs uppercase tracking-widest text-white/40">{label}</div>
    </div>
  );
}
