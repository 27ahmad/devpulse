import { useEffect, useRef } from "react";
import gsap from "gsap";
import { GitCommit, GitPullRequest, Eye, FolderGit2 } from "lucide-react";
import type { RPGStats } from "../utils/gamify";

function XPBar({ value, max }: { value: number; max: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    const pct = Math.min((value / max) * 100, 100);
    gsap.fromTo(
      barRef.current,
      { width: "0%" },
      { width: `${pct}%`, duration: 1.2, ease: "power2.out", delay: 0.3 }
    );
  }, [value, max]);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a2e]">
      <div
        ref={barRef}
        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--purple)]"
      />
    </div>
  );
}

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
        duration: 1,
        ease: "power2.out",
        snap: { textContent: 1 },
        delay: 0.4,
      }
    );
  }, [value]);

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-[var(--text-muted)]">
        {icon}
      </div>
      <div>
        <span ref={ref} className="text-sm font-semibold tabular-nums text-[var(--text)]">
          {value}
        </span>
        <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
      </div>
    </div>
  );
}

export function RPGStatSheet({ stats }: { stats: RPGStats }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl border border-[var(--purple)]/15 bg-[var(--surface)] p-6"
    >
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--purple)]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[var(--accent)]/5 blur-3xl" />

      <div className="relative">
        {/* Header row */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--surface-2)] text-2xl ring-1 ring-white/5">
              {stats.classEmoji}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-[var(--text)]">
                  Level {stats.level}
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  {stats.className}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex-1" style={{ minWidth: 120 }}>
                  <XPBar value={stats.xp} max={stats.xpToNext} />
                </div>
                <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                  {stats.xp.toLocaleString()} / {stats.xpToNext.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>
          <span className="rounded border border-[var(--purple)]/20 bg-[var(--purple)]/5 px-2.5 py-1 text-xs font-medium text-[var(--purple)]">
            {stats.title}
          </span>
        </div>

        {/* Divider */}
        <div className="mb-5 h-px bg-[var(--border-subtle)]" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat icon={<GitCommit size={13} />} value={stats.commits} label="Commits" />
          <Stat icon={<GitPullRequest size={13} />} value={stats.prs} label="Pull requests" />
          <Stat icon={<Eye size={13} />} value={stats.reviews} label="Reviews" />
          <Stat icon={<FolderGit2 size={13} />} value={stats.repoCount} label="Repositories" />
        </div>

        {/* Consistency bar */}
        <div className="mt-5 flex items-center justify-between rounded-md bg-[var(--surface-2)] px-4 py-3">
          <span className="text-xs text-[var(--text-muted)]">Consistency</span>
          <div className="flex items-center gap-2">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-[#1a1a2e]">
              <div
                className="h-full rounded-full bg-[var(--green)] transition-all duration-1000"
                style={{ width: `${stats.consistency}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums text-[var(--green)]">
              {stats.consistency}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
