import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Pause, Play } from "lucide-react";
import type { ContributionData } from "../hooks/useContributions";
import type { GitHubUser } from "../hooks/useGitHubUser";
import { computeInsights } from "../utils/insights";
import { usePalette } from "./usePalette";
import { useStoryControls, usePrefersReducedMotion } from "./useStoryControls";
import type { SceneContext, SceneDef } from "./types";

import { OpeningScene } from "./scenes/OpeningScene";
import { YearOpenScene } from "./scenes/YearOpenScene";
import { TotalContributionsScene } from "./scenes/TotalContributionsScene";
import { HeatmapRevealScene } from "./scenes/HeatmapRevealScene";
import { StreakScene } from "./scenes/StreakScene";
import { CadenceScene } from "./scenes/CadenceScene";
import { BestMonthScene } from "./scenes/BestMonthScene";
import { HomeBaseScene } from "./scenes/HomeBaseScene";
import { ConstellationScene } from "./scenes/ConstellationScene";
import { CollaborationScene } from "./scenes/CollaborationScene";
import { ArchetypeRevealScene } from "./scenes/ArchetypeRevealScene";
import { ShareCardScene } from "./scenes/ShareCardScene";

const SCENES: SceneDef[] = [
  { id: "opening", duration: 2600, Component: OpeningScene },
  { id: "year-open", duration: 3200, Component: YearOpenScene },
  { id: "total", duration: 3800, Component: TotalContributionsScene },
  { id: "heatmap", duration: 5200, Component: HeatmapRevealScene },
  { id: "streak", duration: 3800, Component: StreakScene },
  { id: "cadence", duration: 4200, Component: CadenceScene },
  { id: "best-month", duration: 3600, Component: BestMonthScene },
  { id: "home-base", duration: 4200, Component: HomeBaseScene },
  { id: "languages", duration: 5500, Component: ConstellationScene },
  { id: "collaboration", duration: 4200, Component: CollaborationScene },
  { id: "archetype", duration: 4800, Component: ArchetypeRevealScene },
  { id: "share", duration: 999_999, Component: () => null },
];

interface Props {
  user: GitHubUser;
  contributions: ContributionData;
  onExit: () => void;
}

export function StoryPlayer({ user, contributions, onExit }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const insights = useMemo(
    () => computeInsights({ user, contributions }),
    [user, contributions]
  );
  const palette = usePalette(insights.primaryLanguage);

  const ctx: SceneContext = useMemo(
    () => ({ user, contributions, insights, palette, reducedMotion }),
    [user, contributions, insights, palette, reducedMotion]
  );

  const durations = useMemo(
    () => SCENES.map((s) => (reducedMotion ? Math.min(s.duration, 3000) : s.duration)),
    [reducedMotion]
  );

  const { index, progress, paused, next, prev, setPaused } = useStoryControls(
    SCENES.length,
    durations,
    () => {}
  );

  const holdTimer = useRef<number | null>(null);

  const onPointerDown = () => {
    holdTimer.current = window.setTimeout(() => setPaused(true), 220);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (paused) {
      setPaused(false);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) prev();
    else next();
  };

  const isShareScene = SCENES[index]?.id === "share";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: palette.gradient }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
        {SCENES.map((s, i) => {
          let pct = 0;
          if (i < index) pct = 100;
          else if (i === index && !isShareScene) pct = progress * 100;
          else if (i === index && isShareScene) pct = 100;
          return (
            <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full bg-white"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute right-3 top-6 z-20 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPaused(!paused);
          }}
          className="rounded-full bg-black/40 p-2 text-white/80 backdrop-blur hover:bg-black/60"
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExit();
          }}
          className="rounded-full bg-black/40 p-2 text-white/80 backdrop-blur hover:bg-black/60"
          aria-label="Close story"
        >
          <X size={14} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={SCENES[index].id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {SCENES[index].id === "share" ? (
            <ShareCardScene ctx={ctx} onDeepDive={onExit} />
          ) : (
            (() => {
              const Comp = SCENES[index].Component;
              return <Comp ctx={ctx} />;
            })()
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
