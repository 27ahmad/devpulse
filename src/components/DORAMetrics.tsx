import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { EventSummary } from "../hooks/useGitHubEvents";

function Metric({
  label,
  value,
  unit,
  animate,
}: {
  label: string;
  value: number | string;
  unit: string;
  animate?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animate || !ref.current || typeof value !== "number" || value === 0)
      return;
    gsap.fromTo(
      ref.current,
      { textContent: "0" },
      {
        textContent: String(Math.round(value)),
        duration: 1,
        ease: "power2.out",
        snap: { textContent: 1 },
      }
    );
  }, [value, animate]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>
      <span ref={ref} className="text-2xl font-semibold tabular-nums text-[var(--text)]">
        {typeof value === "number" ? value : value}
      </span>
      <span className="text-[11px] text-[var(--text-muted)]">{unit}</span>
    </div>
  );
}

export function DORAMetrics({ summary }: { summary: EventSummary }) {
  const weeks = Object.keys(summary.weeklyPushes);
  const weekCount = Math.max(weeks.length, 1);
  const avgDeploysPerWeek = (summary.pushesToMain / weekCount).toFixed(1);

  const avgLeadTime =
    summary.prLeadTimes.length > 0
      ? (
          summary.prLeadTimes.reduce((a, b) => a + b, 0) /
          summary.prLeadTimes.length
        ).toFixed(1)
      : null;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text)]">
          Velocity
        </span>
        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
          DORA Lite
        </span>
      </div>
      <p className="mb-5 text-xs text-[var(--text-muted)]">
        Based on the last 90 days of public activity
      </p>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Metric
          label="Deploy freq"
          value={avgDeploysPerWeek}
          unit="pushes/week"
        />
        <Metric
          label="PR lead time"
          value={avgLeadTime ?? "—"}
          unit={avgLeadTime ? "hours avg" : "no data"}
        />
        <Metric
          label="Commits"
          value={summary.totalCommits}
          unit="total"
          animate
        />
        <Metric
          label="PRs merged"
          value={summary.prLeadTimes.length}
          unit="total"
          animate
        />
      </div>
    </div>
  );
}
