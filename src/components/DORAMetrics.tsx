import type { EventSummary } from "../hooks/useGitHubEvents";

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-center">
      <div className={`text-2xl font-bold`} style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[#7d8590]">{label}</div>
      <div className="mt-0.5 text-xs text-[#484f58]">{unit}</div>
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
      : "—";

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
      <h3 className="mb-1 text-sm font-semibold text-white">
        Velocity Metrics (DORA Lite)
      </h3>
      <p className="mb-4 text-xs text-[#484f58]">
        Based on your last 90 days of public activity
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Deploy Frequency"
          value={avgDeploysPerWeek}
          unit="pushes/week to main"
          color="#3fb950"
        />
        <StatCard
          label="PR Lead Time"
          value={avgLeadTime}
          unit={avgLeadTime === "—" ? "no merged PRs" : "hours avg"}
          color="#58a6ff"
        />
        <StatCard
          label="Total Commits"
          value={summary.totalCommits.toLocaleString()}
          unit="in event history"
          color="#d29922"
        />
        <StatCard
          label="PRs Merged"
          value={String(summary.prLeadTimes.length)}
          unit="in event history"
          color="#bc8cff"
        />
      </div>
    </div>
  );
}
