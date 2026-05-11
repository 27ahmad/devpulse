import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-6 text-center text-[#7d8590]">
        No language data available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.language,
    mastery: Math.round(d.mastery),
    bytes: d.bytes,
    repos: d.repoCount,
  }));

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">
        Language Mastery Index
      </h3>
      <ResponsiveContainer width="100%" height={data.length * 40 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#e6edf3", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 8,
              color: "#e6edf3",
              fontSize: 12,
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(_v: any, _n: any, entry: any) => {
              const { bytes, repos } = entry.payload;
              return [`${formatBytes(bytes)} across ${repos} repos`, ""];
            }}
            labelStyle={{ color: "#58a6ff", fontWeight: 600 }}
          />
          <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={getLanguageColor(entry.name)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-[#484f58]">
        R = sqrt(bytes) × sqrt(repos) — balances depth and breadth
      </p>
    </div>
  );
}
