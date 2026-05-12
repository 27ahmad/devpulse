import type { Insights } from "../utils/insights";
import type { SceneDef } from "./types";

export interface SceneCatalog {
  opening: SceneDef;
  yearOpen: SceneDef;
  total: SceneDef;
  heatmap: SceneDef;
  definingDay: SceneDef;
  streak: SceneDef;
  cadence: SceneDef;
  bestMonth: SceneDef;
  homeBase: SceneDef;
  languages: SceneDef;
  linesChanged: SceneDef;
  collaboration: SceneDef;
  archetype: SceneDef;
  share: SceneDef;
}

// Adapt the scene list to a specific user. Scenes that don't have meaningful
// data get dropped so we don't show a streak counter to someone who never
// stretched past a 1-day run.
export function selectScenes(catalog: SceneCatalog, i: Insights): SceneDef[] {
  // Quiet Year: short cinematic arc. Don't force the full flow on someone
  // who barely showed up.
  if (i.archetype.name === "Quiet Year") {
    const out: SceneDef[] = [catalog.opening, catalog.yearOpen, catalog.total];
    if (i.homeBase && i.homeBase.commits >= 1) out.push(catalog.homeBase);
    out.push(catalog.archetype, catalog.share);
    return out;
  }

  const scenes: SceneDef[] = [
    catalog.opening,
    catalog.yearOpen,
    catalog.total,
    catalog.heatmap,
  ];

  if (i.bestDay && i.bestDay.count >= 5) {
    scenes.push(catalog.definingDay);
  }

  if (i.longestStreak >= 3 || i.currentStreak >= 3) {
    scenes.push(catalog.streak);
  }

  if (i.activeDays >= 14) {
    scenes.push(catalog.cadence);
  }

  if (i.bestMonth && i.bestMonth.count >= 10) {
    scenes.push(catalog.bestMonth);
  }

  if (i.homeBase && i.homeBase.commits >= 3) {
    scenes.push(catalog.homeBase);
  }

  if (i.languagesUsedCount >= 1 && i.languages.length > 0) {
    scenes.push(catalog.languages);
  }

  if (i.prAdditions + i.prDeletions >= 500 && i.prSampleCount >= 3) {
    scenes.push(catalog.linesChanged);
  }

  if (i.pullRequests + i.reviews >= 5 || i.collabShare >= 0.05) {
    scenes.push(catalog.collaboration);
  }

  scenes.push(catalog.archetype, catalog.share);
  return scenes;
}
