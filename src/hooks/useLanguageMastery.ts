import { useQuery } from "@tanstack/react-query";
import type { GitHubRepo } from "./useGitHubRepos";

export interface LanguageStat {
  language: string;
  bytes: number;
  repoCount: number;
  mastery: number;
}

async function fetchLanguagesForRepo(
  fullName: string
): Promise<Record<string, number>> {
  const res = await fetch(
    `/api/github?path=repos/${encodeURIComponent(fullName)}/languages`
  );
  if (!res.ok) return {};
  return res.json();
}

async function aggregateLanguages(repos: GitHubRepo[]): Promise<LanguageStat[]> {
  const owned = repos.filter((r) => !r.fork);

  // Cheap pass: build a coarse breakdown from the `language` field on each repo.
  // GitHub gives one language per repo here (the dominant one), no extra requests.
  const coarse = new Map<string, { repos: Set<string>; weight: number }>();
  for (const repo of owned) {
    if (!repo.language) continue;
    const entry = coarse.get(repo.language) ?? { repos: new Set(), weight: 0 };
    entry.repos.add(repo.full_name);
    entry.weight += 1; // each repo counts once toward dominance
    coarse.set(repo.language, entry);
  }

  // Precise pass: drill into the top 5 repos by stars+recency to get real byte counts
  // for the languages that actually matter. Capped so we don't fan out 20+ requests.
  const score = (r: GitHubRepo) => {
    const days = (Date.now() - new Date(r.updated_at).getTime()) / 86_400_000;
    return r.stargazers_count + Math.max(0, 365 - days);
  };
  const drillRepos = [...owned].sort((a, b) => score(b) - score(a)).slice(0, 5);
  const drillResults = await Promise.all(
    drillRepos.map((r) => fetchLanguagesForRepo(r.full_name))
  );

  // Byte counts from the precise pass, by language.
  const preciseBytes = new Map<string, number>();
  drillResults.forEach((langBytes) => {
    for (const [lang, bytes] of Object.entries(langBytes)) {
      preciseBytes.set(lang, (preciseBytes.get(lang) ?? 0) + bytes);
    }
  });

  // For languages we have byte counts for, use those directly.
  // For languages only seen in the coarse pass, synthesize a byte estimate
  // proportional to repo dominance so they still show up in the breakdown.
  const totalPreciseBytes = [...preciseBytes.values()].reduce((s, b) => s + b, 0);
  const avgBytesPerRepoWeight =
    totalPreciseBytes > 0
      ? totalPreciseBytes / Math.max(drillRepos.length, 1)
      : 50_000;

  const stats: LanguageStat[] = [];
  const seen = new Set<string>();

  for (const [lang, bytes] of preciseBytes) {
    const coarseEntry = coarse.get(lang);
    stats.push({
      language: lang,
      bytes,
      repoCount: coarseEntry?.repos.size ?? 1,
      mastery: bytes,
    });
    seen.add(lang);
  }
  for (const [lang, entry] of coarse) {
    if (seen.has(lang)) continue;
    const estBytes = Math.round(avgBytesPerRepoWeight * entry.weight);
    stats.push({
      language: lang,
      bytes: estBytes,
      repoCount: entry.repos.size,
      mastery: estBytes,
    });
  }

  stats.sort((a, b) => b.bytes - a.bytes);
  return stats.slice(0, 10);
}

export function useLanguageMastery(repos: GitHubRepo[] | undefined) {
  return useQuery({
    queryKey: [
      "language-mastery",
      repos?.map((r) => r.full_name).join(",") ?? "",
    ],
    queryFn: () => aggregateLanguages(repos!),
    enabled: !!repos && repos.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
