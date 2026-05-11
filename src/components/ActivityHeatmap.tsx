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

  const rectSize = 15;
  const space = 4;
  const cellTotal = rectSize + space;
  const svgWidth = data.totalWeeks * cellTotal + 60;

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 sm:mb-5">
        <span className="text-sm font-medium text-[var(--text)]">
          Contributions
        </span>
        <span className="text-[11px] text-[var(--text-muted)] sm:text-xs">
          {data.totalContributions.toLocaleString()} in the last year
        </span>
      </div>

      {/* Horizontal scroll wrapper for mobile; collapses to fit on wider screens */}
      <div className="-mx-2 overflow-x-auto px-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
        <div style={{ minWidth: svgWidth }}>
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
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] sm:mt-4 sm:justify-end">
        <span className="sm:hidden text-[10px] text-[var(--text-muted)]/70">
          Scroll to see the full year →
        </span>
        <div className="ml-auto flex items-center gap-2">
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
    </div>
  );
}
