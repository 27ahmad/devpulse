import { useState } from "react";
import { Star, GitFork, ExternalLink, Lock, Clock } from "lucide-react";
import type { GitHubRepo } from "../hooks/useGitHubRepos";
import { getLanguageColor } from "../utils/languages";

export function TopProjects({ repos }: { repos: GitHubRepo[] }) {
  const [sortBy, setSortBy] = useState<"stars" | "updated">("stars");

  const top = [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) => {
      if (sortBy === "stars") {
        return b.stargazers_count - a.stargazers_count;
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    })
    .slice(0, 6);

  if (top.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--text)]">
              Top Projects
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {sortBy === "stars" ? "By stars, all time" : "By recent activity & commits"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setSortBy("stars")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${sortBy === "stars" ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text)]"}`}
            >
              <Star size={10} />
              Most Starred
            </button>
            <button
              onClick={() => setSortBy("updated")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${sortBy === "updated" ? "bg-[var(--surface)] text-[var(--text)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text)]"}`}
            >
              <Clock size={10} />
              Recent Activity
            </button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {top.map((repo, i) => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[var(--surface-2)]"
          >
            <span className="w-5 text-center text-xs tabular-nums text-[var(--text-muted)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
                  {repo.name}
                </span>
                {repo.private && (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500 uppercase tracking-wider">
                    <Lock size={8} className="shrink-0" />
                    Private
                  </span>
                )}
                <ExternalLink
                  size={10}
                  className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100"
                />
              </div>
              {repo.description && (
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {repo.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--text-muted)]">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: getLanguageColor(repo.language),
                    }}
                  />
                  <span className="hidden sm:inline">{repo.language}</span>
                </span>
              )}
              {repo.stargazers_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={11} />
                  {repo.stargazers_count}
                </span>
              )}
              {repo.forks_count > 0 && (
                <span className="flex items-center gap-1">
                  <GitFork size={11} />
                  {repo.forks_count}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
