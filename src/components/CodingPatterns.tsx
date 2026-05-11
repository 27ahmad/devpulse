import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ContributionData } from "../hooks/useContributions";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function DayOfWeekChart({ totals }: { totals: number[] }) {
  const maxVal = Math.max(...totals, 1);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll("[data-bar]");
    gsap.fromTo(
      bars,
      { scaleY: 0 },
      { scaleY: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }
    );
  }, []);

  return (
    <div>
      <div className="mb-3 text-xs font-medium text-[var(--text-secondary)]">
        Most active days
      </div>
      <div ref={barsRef} className="flex items-end gap-1.5" style={{ height: 80 }}>
        {totals.map((val, i) => {
          const height = (val / maxVal) * 100;
          const isMax = val === maxVal && val > 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative w-full" style={{ height: 60 }}>
                <div
                  data-bar
                  className="absolute bottom-0 w-full rounded-sm"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isMax ? "var(--accent)" : "var(--surface-2)",
                    transformOrigin: "bottom",
                  }}
                />
              </div>
              <span
                className={`text-[10px] ${isMax ? "font-medium text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
              >
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyTrend({ monthlyTotals }: { monthlyTotals: Record<string, number> }) {
  const months = Object.entries(monthlyTotals).sort(([a], [b]) => a.localeCompare(b));
  if (months.length < 2) return null;

  const maxVal = Math.max(...months.map(([, v]) => v), 1);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll("[data-bar]");
    gsap.fromTo(
      bars,
      { scaleY: 0 },
      { scaleY: 1, duration: 0.5, stagger: 0.03, ease: "power2.out", delay: 0.2 }
    );
  }, []);

  const current = months[months.length - 1]?.[1] ?? 0;
  const previous = months[months.length - 2]?.[1] ?? 0;
  const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Monthly trend
        </span>
        {diff !== 0 && (
          <span
            className={`flex items-center gap-1 text-[10px] ${diff > 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}
          >
            {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {diff > 0 ? "+" : ""}
            {diff}% vs last month
          </span>
        )}
        {diff === 0 && previous > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Minus size={10} />
            Same as last month
          </span>
        )}
      </div>
      <div ref={barsRef} className="flex items-end gap-px" style={{ height: 48 }}>
        {months.map(([month, val]) => {
          const height = (val / maxVal) * 100;
          const monthNum = parseInt(month.split("-")[1], 10) - 1;
          const isCurrentMonth = month === months[months.length - 1][0];
          return (
            <div key={month} className="group relative flex-1" title={`${MONTH_LABELS[monthNum]}: ${val}`}>
              <div
                data-bar
                className="w-full rounded-sm transition-colors"
                style={{
                  height: `${Math.max(height, 2)}%`,
                  backgroundColor: isCurrentMonth ? "var(--accent)" : "var(--surface-2)",
                  transformOrigin: "bottom",
                }}
              />
              {months.length <= 12 && (
                <span className="mt-1 block text-center text-[8px] text-[var(--text-muted)]">
                  {MONTH_LABELS[monthNum]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CodingPatterns({ data }: { data: ContributionData }) {
  const activeDays = Object.values(data.dailyContributions).filter((c) => c > 0).length;
  const avgPerActiveDay =
    activeDays > 0 ? (data.totalContributions / activeDays).toFixed(1) : "0";

  const bestDay = data.dayOfWeekTotals.indexOf(Math.max(...data.dayOfWeekTotals));

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text)]">
          Coding Patterns
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">Past year</span>
      </div>
      <p className="mb-5 text-xs text-[var(--text-muted)]">
        {activeDays} active days &middot; {avgPerActiveDay} contributions/day
        &middot; Most active on {DAY_LABELS[bestDay]}s
      </p>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div>
          <div className="text-lg font-semibold tabular-nums text-[var(--text)]">
            {data.totalContributions.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">contributions</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums text-[var(--text)]">
            {data.commits.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">commits</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums text-[var(--text)]">
            {data.pullRequests}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">PRs opened</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums text-[var(--text)]">
            {data.consistency}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">consistency</div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <DayOfWeekChart totals={data.dayOfWeekTotals} />
        <MonthlyTrend monthlyTotals={data.monthlyTotals} />
      </div>
    </div>
  );
}
