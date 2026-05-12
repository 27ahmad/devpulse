import { motion } from "framer-motion";
import {
  Sparkles,
  Star,
  FolderPlus,
  ExternalLink,
  GitCommit,
  Calendar,
  CalendarRange,
  Flame,
} from "lucide-react";
import type { Insights } from "../utils/insights";
import { getLanguageColor } from "../utils/languages";

interface Props {
  insights: Insights;
}

interface BeamSegment {
  language: string;
  pct: number;
  color: string;
}

function buildSegments(insights: Insights): BeamSegment[] {
  const total = insights.languages.reduce((s, l) => s + l.commits, 0);
  if (total === 0) return [];
  const segs: BeamSegment[] = [];
  let other = 0;
  for (const l of insights.languages) {
    const pct = l.commits / total;
    const color = l.color ?? getLanguageColor(l.language);
    if (pct >= 0.02) segs.push({ language: l.language, pct, color });
    else other += l.commits;
  }
  if (other / total >= 0.01) {
    segs.push({ language: "Other", pct: other / total, color: "#52525b" });
  }
  return segs;
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DefiningMoments({ insights }: { insights: Insights }) {
  const items: Array<{ icon: React.ReactNode; label: string; value: string; sub: string }> = [];

  if (insights.bestDay) {
    items.push({
      icon: <Flame size={11} />,
      label: "Best day",
      value: formatShortDate(insights.bestDay.date),
      sub: `${insights.bestDay.count.toLocaleString()} contributions`,
    });
  }
  if (insights.bestWeek) {
    items.push({
      icon: <CalendarRange size={11} />,
      label: "Best week",
      value: `Wk of ${formatShortDate(insights.bestWeek.weekStartDate)}`,
      sub: `${insights.bestWeek.count.toLocaleString()} contributions`,
    });
  }
  if (insights.bestMonth) {
    items.push({
      icon: <Calendar size={11} />,
      label: "Best month",
      value: insights.bestMonth.label,
      sub: `${insights.bestMonth.count.toLocaleString()} contributions`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/30 p-3"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            {it.icon}
            {it.label}
          </div>
          <div className="mt-1.5 text-base font-semibold text-[var(--text)]">
            {it.value}
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">
            {it.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniBeam({ insights }: { insights: Insights }) {
  const segments = buildSegments(insights);
  if (segments.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/30 p-4 text-center text-xs text-[var(--text-muted)]">
        No language data this year.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        <span>Where your commits went</span>
        <span>{segments.length} languages</span>
      </div>
      <div className="flex h-10 w-full overflow-hidden rounded-md">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.language}
            initial={{ width: 0 }}
            animate={{ width: `${seg.pct * 100}%` }}
            transition={{
              duration: 0.8,
              delay: 0.15 + i * 0.05,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="relative h-full"
            style={{
              background: `linear-gradient(180deg, ${seg.color}, ${seg.color}c0)`,
              boxShadow:
                i === 0
                  ? `inset 0 0 20px ${seg.color}66`
                  : `inset 0 0 14px ${seg.color}44`,
            }}
            title={`${seg.language} · ${(seg.pct * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
        {segments.slice(0, 7).map((seg) => (
          <div key={seg.language} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[var(--text-secondary)]">{seg.language}</span>
            <span className="tabular-nums text-[var(--text-muted)]">
              {(seg.pct * 100).toFixed(seg.pct >= 0.1 ? 0 : 1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopReposList({ insights }: { insights: Insights }) {
  const repos = insights.topRepos.filter((r) => r.commits > 0);
  if (repos.length === 0) return null;
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/30">
      <div className="border-b border-[var(--border-subtle)] px-4 pb-2 pt-3 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        Where your commits landed
      </div>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {repos.map((r) => {
          const accent = r.primaryLanguageColor ?? "#a78bfa";
          return (
            <li key={r.nameWithOwner}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-2)]/60"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span className="truncate text-sm text-[var(--text)] group-hover:text-[var(--accent)]">
                    {r.nameWithOwner}
                  </span>
                  <ExternalLink
                    size={10}
                    className="shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
                  <GitCommit size={11} className="text-[var(--text-muted)]" />
                  {r.commits.toLocaleString()}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/30 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div
          className="text-xl font-semibold tabular-nums"
          style={{ color: accent ?? "var(--text)" }}
        >
          {value}
        </div>
        {icon && (
          <span className="text-[var(--text-muted)]" style={{ color: accent ?? undefined }}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      {hint && (
        <div className="mt-1 truncate text-[10px] text-[var(--text-muted)]/70">
          {hint}
        </div>
      )}
    </div>
  );
}

function formatLines(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function QuietYearPanel({ insights, accent }: { insights: Insights; accent: string }) {
  return (
    <div className="px-5 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <Sparkles size={14} style={{ color: accent }} />
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Archetype
        </span>
      </div>
      <h3
        className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
        style={{
          background: `linear-gradient(135deg, ${accent}, #ffffff)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {insights.archetype.name}
      </h3>
      <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
        {insights.archetype.tagline}
      </p>
      <div className="mt-4 text-xs text-[var(--text-muted)]">
        Not enough public activity this year to compose a full story. The
        dashboard below shows what we have.
      </div>
    </div>
  );
}

export function InsightsPanel({ insights }: Props) {
  const accent = insights.primaryLanguage
    ? getLanguageColor(insights.primaryLanguage)
    : "#a78bfa";

  if (insights.archetype.name === "Quiet Year") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="border-t border-[var(--border-subtle)]"
      >
        <QuietYearPanel insights={insights} accent={accent} />
      </motion.div>
    );
  }

  const showLinesTile = insights.prAdditions + insights.prDeletions >= 200;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="border-t border-[var(--border-subtle)] px-5 py-6 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: accent }} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Archetype
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
          Past year
        </span>
      </div>

      <h3
        className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
        style={{
          background: `linear-gradient(135deg, ${accent}, #ffffff)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {insights.archetype.name}
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
        {insights.archetype.tagline}
      </p>

      {/* Defining moments — concrete dates that anchor the year */}
      <div className="mt-6">
        <DefiningMoments insights={insights} />
      </div>

      {/* Mini Beam */}
      <div className="mt-4">
        <MiniBeam insights={insights} />
      </div>

      {/* Top repos */}
      <div className="mt-4">
        <TopReposList insights={insights} />
      </div>

      {/* Year-in-numbers tiles */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile
          label="Stars earned"
          value={insights.starsEarned.toLocaleString()}
          accent={accent}
          icon={<Star size={14} />}
          hint="on repos you own"
        />
        <Tile
          label="New projects"
          value={insights.reposCreatedThisYear.toString()}
          icon={<FolderPlus size={14} />}
          hint="started this year"
        />
        {showLinesTile ? (
          <Tile
            label="Lines net"
            value={`${insights.prAdditions - insights.prDeletions >= 0 ? "+" : "−"}${formatLines(Math.abs(insights.prAdditions - insights.prDeletions))}`}
            hint={`+${formatLines(insights.prAdditions)} / −${formatLines(insights.prDeletions)} in PRs`}
          />
        ) : (
          <Tile
            label="Specialization"
            value={`${Math.round(insights.specializationPct * 100)}%`}
            hint={insights.primaryLanguage ?? undefined}
          />
        )}
        <Tile
          label="Collaboration"
          value={`${Math.round(insights.collabShare * 100)}%`}
          hint="PRs + reviews"
        />
      </div>
    </motion.div>
  );
}
