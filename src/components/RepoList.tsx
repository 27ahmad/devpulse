import type { GitHubRepo } from "../hooks/useGitHubRepos";
import { getLanguageColor } from "../utils/languages";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-[#30363d] bg-[#161b22] p-4 transition-colors hover:border-[#58a6ff]"
    >
      <div className="mb-2 flex items-center gap-2">
        <h3 className="truncate text-sm font-semibold text-[#58a6ff]">
          {repo.name}
        </h3>
        {repo.fork && (
          <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs text-[#7d8590]">
            fork
          </span>
        )}
      </div>
      {repo.description && (
        <p className="mb-3 line-clamp-2 text-xs text-[#7d8590]">
          {repo.description}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-[#7d8590]">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: getLanguageColor(repo.language) }}
            />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span>&#9733; {repo.stargazers_count}</span>
        )}
        {repo.forks_count > 0 && (
          <span>&#9741; {repo.forks_count}</span>
        )}
        <span className="ml-auto">{timeAgo(repo.updated_at)}</span>
      </div>
    </a>
  );
}

export function RepoList({ repos }: { repos: GitHubRepo[] }) {
  if (repos.length === 0) {
    return (
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-8 text-center text-[#7d8590]">
        No public repositories found.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
