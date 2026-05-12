import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../utils/fetchApi";

export interface LanguageStat {
  language: string;
  commits: number;
  repoCount: number;
  color: string | null;
}

export interface RepoRef {
  nameWithOwner: string;
  url: string;
  commits: number;
  primaryLanguage: string | null;
  primaryLanguageColor: string | null;
}

export type HomeBase = RepoRef;

export interface DayMark {
  date: string;
  count: number;
}

export interface WeekMark {
  weekStartDate: string;
  count: number;
}

export interface ContributionData {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  dailyContributions: Record<string, number>;
  dayOfWeekTotals: number[];
  monthlyTotals: Record<string, number>;
  consistency: number;
  totalWeeks: number;
  weeksWithActivity: number;

  firstActiveDate: string | null;
  lastActiveDate: string | null;
  bestDay: DayMark | null;
  bestWeek: WeekMark | null;
  languages: LanguageStat[];
  homeBase: HomeBase | null;
  topRepos: RepoRef[];
  reposCreatedThisYear: number;
  reposContributedTo: number;
  ownedReposContributed: number;
  starsEarned: number;
  restrictedContributions: number;

  prAdditions: number;
  prDeletions: number;
  prChangedFiles: number;
  prMerged: number;
  prSampleCount: number;

  userCreatedAt: string;
}

async function fetchContributions(username: string): Promise<ContributionData> {
  return fetchJson<ContributionData>(
    `/api/graphql?username=${encodeURIComponent(username)}`
  );
}

export function useContributions(username: string) {
  return useQuery({
    queryKey: ["contributions", username],
    queryFn: () => fetchContributions(username),
    enabled: username.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
