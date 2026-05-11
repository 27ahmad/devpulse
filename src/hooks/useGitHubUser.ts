import { useQuery } from "@tanstack/react-query";

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
  const res = await fetch(
    `/api/github?path=users/${encodeURIComponent(username)}`
  );
  if (!res.ok) {
    throw new Error(res.status === 404 ? "User not found" : "Failed to fetch user");
  }
  return res.json();
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
