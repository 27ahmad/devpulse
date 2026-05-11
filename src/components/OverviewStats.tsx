import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Calendar, Star, GitFork, Code, FolderGit2 } from "lucide-react";
import type { GitHubUser } from "../hooks/useGitHubUser";
import type { GitHubRepo } from "../hooks/useGitHubRepos";

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || value === 0) return;
    gsap.fromTo(
      ref.current,
      { textContent: "0" },
      {
        textContent: String(value),
        duration: 0.8,
        ease: "power2.out",
        snap: { textContent: 1 },
      }
    );
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1.5 py-3">
      <div className="text-[var(--text-muted)]">{icon}</div>
      <span
        ref={ref}
        className="text-lg font-semibold tabular-nums text-[var(--text)]"
      >
        {value}
      </span>
      <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

export function OverviewStats({
  user,
  repos,
}: {
  user: GitHubUser;
  repos: GitHubRepo[];
}) {
  const yearsActive =
    new Date().getFullYear() - new Date(user.created_at).getFullYear();
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const uniqueLanguages = new Set(
    repos.map((r) => r.language).filter(Boolean)
  ).size;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text)]">
            Overview
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">All time</span>
        </div>
      </div>
      <div className="grid grid-cols-5 divide-x divide-[var(--border-subtle)]">
        <Stat icon={<Calendar size={14} />} value={yearsActive} label="Years" />
        <Stat
          icon={<FolderGit2 size={14} />}
          value={repos.length}
          label="Repos"
        />
        <Stat icon={<Star size={14} />} value={totalStars} label="Stars" />
        <Stat icon={<GitFork size={14} />} value={totalForks} label="Forks" />
        <Stat
          icon={<Code size={14} />}
          value={uniqueLanguages}
          label="Languages"
        />
      </div>
    </div>
  );
}
