import type { Insights } from "../utils/insights";
import type { ContributionData } from "../hooks/useContributions";
import type { GitHubUser } from "../hooks/useGitHubUser";
import type { Palette } from "./usePalette";

export interface SceneContext {
  user: GitHubUser;
  insights: Insights;
  contributions: ContributionData;
  palette: Palette;
  reducedMotion: boolean;
}

export interface SceneDef {
  id: string;
  duration: number;
  Component: React.ComponentType<{ ctx: SceneContext }>;
}
