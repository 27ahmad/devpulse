import type { LanguageStat } from "../hooks/useLanguageMastery";
import { getLanguageColor } from "../utils/languages";

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}KB`;
  return `${bytes}B`;
}

function LanguageBar({ stat, maxMastery }: { stat: LanguageStat; maxMastery: number }) {
  const pct = (stat.mastery / maxMastery) * 100;
  const color = getLanguageColor(stat.language);

  return (
    <div className="group flex items-center gap-3">
      <span className="w-20 shrink-0 text-right text-xs text-[var(--text-secondary)]">
        {stat.language}
      </span>
      <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-[var(--surface-2)]">
        <div
          className="h-full rounded-sm transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="hidden w-28 text-xs text-[var(--text-muted)] group-hover:inline sm:inline">
        {formatBytes(stat.bytes)} / {stat.repoCount} repos
      </span>
    </div>
  );
}

export function LanguageChart({ data }: { data: LanguageStat[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        No language data available.
      </div>
    );
  }

  const maxMastery = data[0]?.mastery ?? 1;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-1 text-sm font-medium text-[var(--text)]">
        Language Mastery
      </div>
      <p className="mb-5 text-xs text-[var(--text-muted)]">
        Weighted by code volume and project diversity
      </p>
      <div className="flex flex-col gap-2.5">
        {data.map((stat) => (
          <LanguageBar key={stat.language} stat={stat} maxMastery={maxMastery} />
        ))}
      </div>
    </div>
  );
}
