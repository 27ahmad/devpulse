import { useQuery } from "@tanstack/react-query";

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
}

async function fetchContributions(username: string): Promise<ContributionData> {
  const res = await fetch(
    `/api/graphql?username=${encodeURIComponent(username)}`
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch contributions");
  }
  return res.json();
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
