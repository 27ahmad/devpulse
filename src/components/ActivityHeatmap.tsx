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

      {/* Horizontal scroller with themed scrollbar + right-edge fade */}
      <div className="dp-fade-right -mx-2 sm:mx-0">
        <div className="dp-scroll overflow-x-auto px-2 pb-2 sm:px-0">
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
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-[var(--text-muted)] sm:mt-4">
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
