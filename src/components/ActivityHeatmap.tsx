import HeatMap from "@uiw/react-heat-map";

interface Props {
  dailyCommits: Record<string, number>;
}

export function ActivityHeatmap({ dailyCommits }: Props) {
  const entries = Object.entries(dailyCommits);
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        No activity data available.
      </div>
    );
  }

  const value = entries.map(([date, count]) => ({ date, count }));
  const dates = entries.map(([d]) => d).sort();
  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--text)]">
            Contributions
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {total.toLocaleString()} in the last {dates.length} active days
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <HeatMap
          value={value}
          startDate={startDate}
          endDate={endDate}
          width="100%"
          rectSize={11}
          space={3}
          style={{ color: "var(--text-muted)" }}
          panelColors={{
            0: "var(--surface-2)",
            2: "#14532d",
            4: "#166534",
            8: "#15803d",
            12: "#22c55e",
          }}
          rectProps={{ rx: 2 }}
        />
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[var(--text-muted)]">
        <span>Less</span>
        {["var(--surface-2)", "#14532d", "#166534", "#15803d", "#22c55e"].map(
          (c) => (
            <span
              key={c}
              className="inline-block h-[10px] w-[10px] rounded-sm"
              style={{ backgroundColor: c }}
            />
          )
        )}
        <span>More</span>
      </div>
    </div>
  );
}
