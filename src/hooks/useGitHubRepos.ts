import { useQuery } from "@tanstack/react-query";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  fork: boolean;
}

async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `/api/github?path=users/${encodeURIComponent(username)}/repos&sort=updated&per_page=100&type=owner&page=${page}`
    );
    if (!res.ok) throw new Error("Failed to fetch repos");
    const repos: GitHubRepo[] = await res.json();
    allRepos.push(...repos);
    if (repos.length < 100) break;
  }
  return allRepos;
}

export function useGitHubRepos(username: string) {
  return useQuery({
    queryKey: ["github-repos", username],
    queryFn: () => fetchRepos(username),
    enabled: username.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
