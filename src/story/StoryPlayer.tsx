import { useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Pause, Play } from "lucide-react";
import type { ContributionData } from "../hooks/useContributions";
import type { GitHubUser } from "../hooks/useGitHubUser";
import { computeInsights } from "../utils/insights";
import { usePalette } from "./usePalette";
import { useStoryControls, usePrefersReducedMotion } from "./useStoryControls";
import type { SceneContext, SceneDef } from "./types";
import { selectScenes, type SceneCatalog } from "./sceneSelection";

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
import { DefiningDayScene } from "./scenes/DefiningDayScene";
import { LinesChangedScene } from "./scenes/LinesChangedScene";

// Durations are tuned to each scene's animation envelope: short for transitions,
// longer for reveals where the user needs a beat to read.
const CATALOG: SceneCatalog = {
  opening: { id: "opening", duration: 3200, Component: OpeningScene },
  yearOpen: { id: "year-open", duration: 3600, Component: YearOpenScene },
  total: { id: "total", duration: 4600, Component: TotalContributionsScene },
  heatmap: { id: "heatmap", duration: 6400, Component: HeatmapRevealScene },
  definingDay: { id: "defining-day", duration: 4800, Component: DefiningDayScene },
  streak: { id: "streak", duration: 4600, Component: StreakScene },
  cadence: { id: "cadence", duration: 5200, Component: CadenceScene },
  bestMonth: { id: "best-month", duration: 4600, Component: BestMonthScene },
  homeBase: { id: "home-base", duration: 5400, Component: HomeBaseScene },
  languages: { id: "languages", duration: 6800, Component: ConstellationScene },
  linesChanged: { id: "lines-changed", duration: 5400, Component: LinesChangedScene },
  collaboration: { id: "collaboration", duration: 5200, Component: CollaborationScene },
  archetype: { id: "archetype", duration: 6000, Component: ArchetypeRevealScene },
  share: { id: "share", duration: 999_999, Component: () => null },
};

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

  const scenes: SceneDef[] = useMemo(
    () => selectScenes(CATALOG, insights),
    [insights]
  );

  const ctx: SceneContext = useMemo(
    () => ({ user, contributions, insights, palette, reducedMotion }),
    [user, contributions, insights, palette, reducedMotion]
  );

  const durations = useMemo(
    () => scenes.map((s) => (reducedMotion ? Math.min(s.duration, 2800) : s.duration)),
    [scenes, reducedMotion]
  );

  const totalDuration = useMemo(
    () =>
      durations.reduce(
        (s, d, i) => s + (scenes[i]?.id === "share" ? 0 : d),
        0
      ) || 1,
    [durations, scenes]
  );

  const { index, progress, paused, next, prev, goTo, setPaused } = useStoryControls(
    scenes.length,
    durations,
    () => {}
  );

  const handleReplay = useCallback(() => {
    goTo(0);
    setPaused(false);
  }, [goTo, setPaused]);

  const holdTimer = useRef<number | null>(null);

  // The story container reacts to taps for advance/back, but only when the
  // user actually clicked the backdrop — not when they tapped a button or
  // link sitting on top of it.
  const isInteractive = (e: React.PointerEvent) =>
    !!(e.target as HTMLElement).closest("button, a, input");

  const onPointerDown = (e: React.PointerEvent) => {
    if (isInteractive(e)) return;
    holdTimer.current = window.setTimeout(() => setPaused(true), 220);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (isInteractive(e)) return;
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

  const currentScene = scenes[index];
  const isShareScene = currentScene?.id === "share";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: palette.gradient }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Weighted progress bar — segments scale to each scene's duration */}
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
        {scenes.map((s, i) => {
          const isShareSeg = s.id === "share";
          const flex = isShareSeg
            ? 0.5
            : Math.max(0.4, (durations[i] ?? 3000) / (totalDuration / scenes.length));
          let pct = 0;
          if (i < index) pct = 100;
          else if (i === index && !isShareScene) pct = progress * 100;
          else if (i === index && isShareScene) pct = 100;
          return (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              style={{ flex }}
              className="group relative h-[3px] overflow-hidden rounded-full bg-white/15"
              aria-label={`Jump to ${s.id}`}
            >
              <motion.div
                className="h-full bg-white"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </button>
          );
        })}
      </div>

      <div className="absolute right-3 top-6 z-20 flex items-center gap-2">
        <button
          onClick={() => setPaused(!paused)}
          className="rounded-full bg-black/40 p-2 text-white/80 backdrop-blur hover:bg-black/60"
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        <button
          onClick={onExit}
          className="rounded-full bg-black/40 p-2 text-white/80 backdrop-blur hover:bg-black/60"
          aria-label="Close story"
        >
          <X size={14} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene?.id ?? "empty"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentScene && currentScene.id === "share" ? (
            <ShareCardScene
              ctx={ctx}
              onDeepDive={onExit}
              onReplay={handleReplay}
            />
          ) : currentScene ? (
            (() => {
              const Comp = currentScene.Component;
              return <Comp ctx={ctx} />;
            })()
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
