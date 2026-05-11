import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../utils/fetchApi";

export interface LanguageStat {
  language: string;
  bytes: number;
  repoCount: number;
  color: string | null;
}

export interface HomeBase {
  nameWithOwner: string;
  url: string;
  commits: number;
  primaryLanguage: string | null;
  primaryLanguageColor: string | null;
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
  languages: LanguageStat[];
  homeBase: HomeBase | null;
  reposCreatedThisYear: number;
  reposContributedTo: number;
  starsEarned: number;
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
