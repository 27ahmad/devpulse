import type { LanguageStat } from "../hooks/useLanguageMastery";
import { getLanguageColor } from "../utils/languages";

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}KB`;
  return `${bytes}B`;
}

export function LanguageChart({ data }: { data: LanguageStat[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        No language data available.
      </div>
    );
  }

  const totalBytes = data.reduce((sum, d) => sum + d.bytes, 0);

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-5 text-sm font-medium text-[var(--text)]">
        Languages
      </div>

      {/* Stacked bar */}
      <div className="mb-4 flex h-2 overflow-hidden rounded-full">
        {data.map((stat) => {
          const pct = (stat.bytes / totalBytes) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={stat.language}
              style={{
                width: `${pct}%`,
                backgroundColor: getLanguageColor(stat.language),
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
        {data.map((stat) => {
          const pct = ((stat.bytes / totalBytes) * 100).toFixed(1);
          return (
            <div key={stat.language} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: getLanguageColor(stat.language) }}
                />
                <span className="text-xs text-[var(--text-secondary)]">
                  {stat.language}
                </span>
              </div>
              <span className="text-xs tabular-nums text-[var(--text-muted)]">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-[10px] text-[var(--text-muted)]">
        {formatBytes(totalBytes)} across {data.reduce((s, d) => s + d.repoCount, 0)} repositories
      </div>
    </div>
  );
}
