import HeatMap from "@uiw/react-heat-map";

interface Props {
  dailyCommits: Record<string, number>;
}

export function ActivityHeatmap({ dailyCommits }: Props) {
  const entries = Object.entries(dailyCommits);
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-6 text-center text-[#7d8590]">
        No activity data available.
      </div>
    );
  }

  const value = entries.map(([date, count]) => ({
    date,
    count,
  }));

  const dates = entries.map(([d]) => d).sort();
  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[dates.length - 1]);

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">
        Activity Heatmap
      </h3>
      <div className="overflow-x-auto">
        <HeatMap
          value={value}
          startDate={startDate}
          endDate={endDate}
          width="100%"
          rectSize={12}
          space={3}
          style={{ color: "#7d8590" }}
          panelColors={{
            0: "#161b22",
            2: "#0e4429",
            4: "#006d32",
            8: "#26a641",
            12: "#39d353",
          }}
          rectProps={{
            rx: 2,
          }}
        />
      </div>
    </div>
  );
}
