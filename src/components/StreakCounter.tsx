import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Flame, Trophy } from "lucide-react";
import type { StreakResult } from "../utils/streaks";

function CounterCard({
  value,
  label,
  sub,
  icon,
  active,
}: {
  value: number;
  label: string;
  sub: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!numRef.current || value === 0) return;
    gsap.fromTo(
      numRef.current,
      { textContent: "0" },
      {
        textContent: String(value),
        duration: 1.2,
        ease: "power2.out",
        snap: { textContent: 1 },
      }
    );
  }, [value]);

  return (
    <div
      className={`rounded-lg border bg-[var(--surface)] p-5 ${active ? "border-[var(--green)]/20" : "border-[var(--border-subtle)]"}`}
    >
      <div className="mb-3 flex items-center gap-2 text-[var(--text-muted)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          ref={numRef}
          className={`text-3xl font-semibold tabular-nums ${active ? "text-[var(--green)]" : "text-[var(--text)]"}`}
        >
          {value}
        </span>
        <span className="text-xs text-[var(--text-muted)]">{sub}</span>
      </div>
    </div>
  );
}

export function StreakCounter({ streak }: { streak: StreakResult }) {
  const isActive = streak.currentStreak > 0;

  return (
    <div className="grid grid-cols-2 gap-2">
      <CounterCard
        value={streak.currentStreak}
        label="Current streak"
        sub="days"
        icon={<Flame size={14} className={isActive ? "text-[var(--green)]" : ""} />}
        active={isActive}
      />
      <CounterCard
        value={streak.longestStreak}
        label="Best streak"
        sub="days"
        icon={<Trophy size={14} />}
      />
    </div>
  );
}
