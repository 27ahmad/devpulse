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

async function aggregateLanguages(
  repos: GitHubRepo[]
): Promise<LanguageStat[]> {
  const top = repos.filter((r) => !r.fork).slice(0, 20);

  const results = await Promise.all(
    top.map((r) => fetchLanguagesForRepo(r.full_name))
  );

  const langMap = new Map<string, { bytes: number; repos: Set<string> }>();

  results.forEach((langBytes, i) => {
    for (const [lang, bytes] of Object.entries(langBytes)) {
      const existing = langMap.get(lang) ?? { bytes: 0, repos: new Set() };
      existing.bytes += bytes;
      existing.repos.add(top[i].full_name);
      langMap.set(lang, existing);
    }
  });

  const stats: LanguageStat[] = [];
  for (const [language, data] of langMap) {
    const repoCount = data.repos.size;
    const mastery = Math.sqrt(data.bytes) * Math.sqrt(repoCount);
    stats.push({ language, bytes: data.bytes, repoCount, mastery });
  }

  stats.sort((a, b) => b.mastery - a.mastery);
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
