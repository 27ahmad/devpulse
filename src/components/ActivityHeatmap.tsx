import HeatMap from "@uiw/react-heat-map";
import type { ContributionData } from "../hooks/useContributions";

export function ActivityHeatmap({ data }: { data: ContributionData }) {
  const entries = Object.entries(data.dailyContributions);
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
        No contribution data available.
      </div>
    );
  }

  const value = entries
    .filter(([, count]) => count > 0)
    .map(([date, count]) => ({ date: date.replace(/-/g, "/"), count }));

  const dates = entries.map(([d]) => d.replace(/-/g, "/")).sort();
  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);

  // Scale cells to fill the wide container
  const rectSize = 15;
  const space = 4;
  const cellTotal = rectSize + space;
  const svgWidth = data.totalWeeks * cellTotal + 60;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-[var(--text)]">
          Contributions
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {data.totalContributions.toLocaleString()} in the last year
        </span>
      </div>
      <div>
        <HeatMap
          value={value}
          startDate={startDate}
          endDate={endDate}
          width={svgWidth}
          rectSize={rectSize}
          legendCellSize={0}
          space={space}
          style={{
            width: "100%",
            color: "var(--text-muted)",
            fontSize: 10,
          }}
          panelColors={{
            0: "var(--surface-2)",
            2: "#14532d",
            4: "#166534",
            8: "#15803d",
            12: "#22c55e",
          }}
          rectProps={{ rx: 3 }}
        />
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-[var(--text-muted)]">
        <span>Less</span>
        {["var(--surface-2)", "#14532d", "#166534", "#15803d", "#22c55e"].map(
          (c) => (
            <span
              key={c}
              className="inline-block h-[11px] w-[11px] rounded-sm"
              style={{ backgroundColor: c }}
            />
          )
        )}
        <span>More</span>
      </div>
    </div>
  );
}
