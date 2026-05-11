import { Star } from "lucide-react";
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
      className="group block rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--border)]"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <h3 className="truncate text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
          {repo.name}
        </h3>
        {repo.fork && (
          <span className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            fork
          </span>
        )}
      </div>
      {repo.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
          {repo.description}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: getLanguageColor(repo.language) }}
            />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="flex items-center gap-1">
            <Star size={11} />
            {repo.stargazers_count}
          </span>
        )}
        <span className="ml-auto text-[var(--text-muted)]">
          {timeAgo(repo.updated_at)}
        </span>
      </div>
    </a>
  );
}

export function RepoList({ repos }: { repos: GitHubRepo[] }) {
  if (repos.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
        No public repositories found.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
