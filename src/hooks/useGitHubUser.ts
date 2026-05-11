import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../utils/fetchApi";

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
}

async function fetchUser(username: string): Promise<GitHubUser> {
  return fetchJson<GitHubUser>(
    `/api/github?path=users/${encodeURIComponent(username)}`
  );
}

export function useGitHubUser(username: string) {
  return useQuery({
    queryKey: ["github-user", username],
    queryFn: () => fetchUser(username),
    enabled: username.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
