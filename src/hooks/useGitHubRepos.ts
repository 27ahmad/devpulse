import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../utils/fetchApi";

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
  private: boolean;
}

async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const loggedInUser = localStorage.getItem("devpulse_github_username");
  const isSelf = loggedInUser && loggedInUser.toLowerCase() === username.toLowerCase();
  const path = isSelf ? "user/repos" : `users/${encodeURIComponent(username)}/repos`;

  const allRepos: GitHubRepo[] = [];
  for (let page = 1; page <= 2; page++) {
    const repos = await fetchJson<GitHubRepo[]>(
      `/api/github?path=${path}&sort=updated&per_page=100&type=owner&page=${page}`
    );
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
