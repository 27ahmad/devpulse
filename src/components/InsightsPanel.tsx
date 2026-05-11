import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Insights } from "../utils/insights";
import { getLanguageColor } from "../utils/languages";

interface Props {
  insights: Insights;
}

function pickHighlight(i: Insights): string {
  if (i.archetype.name === "Specialist" && i.primaryLanguage) {
    return `Top language: ${i.primaryLanguage} (${Math.round(i.specializationPct * 100)}%)`;
  }
  if (i.archetype.name === "Polyglot") {
    return `${i.languagesUsedCount} languages, entropy ${i.languageDiversity.toFixed(2)}`;
  }
  if (i.archetype.name === "Collaborator" || i.archetype.name === "Maintainer") {
    return `${i.reviews} reviews vs ${i.pullRequests} PRs opened`;
  }
  if (i.archetype.name === "Marathoner") {
    return `Active in ${i.consistency}% of weeks`;
  }
  if (i.archetype.name === "Sprinter") {
    return `${i.velocity.toFixed(1)} contributions per active day`;
  }
  if (i.archetype.name === "Weekend Hacker") {
    return `Weekday:weekend ratio ${i.weekdayWeekendRatio.toFixed(1)}`;
  }
  return `${i.activeDays} active days, ${i.totalContributions.toLocaleString()} contributions`;
}

function Tile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/30 p-4">
      <div
        className="text-xl font-semibold tabular-nums"
        style={{ color: accent ?? "var(--text)" }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
      {hint && (
        <div className="mt-1 text-[10px] text-[var(--text-muted)]/70">
          {hint}
        </div>
      )}
    </div>
  );
}

export function InsightsPanel({ insights }: Props) {
  const accent = insights.primaryLanguage
    ? getLanguageColor(insights.primaryLanguage)
    : "#a78bfa";

  const cadenceLabel =
    insights.weekdayWeekendRatio >= 4
      ? "Weekday only"
      : insights.weekdayWeekendRatio < 1.5
        ? "Even split"
        : "Weekday-leaning";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="border-t border-[var(--border-subtle)] p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: accent }} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Archetype
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">Past year</span>
      </div>

      <h3
        className="mt-1 text-3xl font-semibold tracking-tight"
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

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="Specialization"
          value={`${Math.round(insights.specializationPct * 100)}%`}
          hint={insights.primaryLanguage ?? undefined}
          accent={accent}
        />
        <Tile
          label="Languages"
          value={insights.languagesUsedCount.toString()}
          hint={`entropy ${insights.languageDiversity.toFixed(2)}`}
        />
        <Tile
          label="Collaboration"
          value={`${Math.round(insights.collabShare * 100)}%`}
          hint="PRs + reviews"
        />
        <Tile
          label="Cadence"
          value={cadenceLabel}
          hint={`Peak: ${insights.peakDay}`}
        />
      </div>

      <div className="mt-4 text-xs text-[var(--text-muted)]">
        <span className="text-[var(--text-secondary)]">What stands out: </span>
        {pickHighlight(insights)}
      </div>
    </motion.div>
  );
}
