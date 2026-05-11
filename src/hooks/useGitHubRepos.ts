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
  updated_at: string;
  fork: boolean;
}

async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `/api/github?path=users/${encodeURIComponent(username)}/repos&sort=updated&per_page=30&type=owner`
  );
  if (!res.ok) throw new Error("Failed to fetch repos");
  return res.json();
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
