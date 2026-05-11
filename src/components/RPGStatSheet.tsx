import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Shield, Swords, Heart, Users } from "lucide-react";
import type { RPGStats } from "../utils/gamify";

function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    const pct = Math.min((value / max) * 100, 100);
    gsap.fromTo(
      barRef.current,
      { width: "0%" },
      { width: `${pct}%`, duration: 1, ease: "power2.out" }
    );
  }, [value, max]);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div ref={barRef} className="h-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  sub,
  color,
  bar,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bar?: { value: number; max: number };
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-[var(--text-muted)]">{label}</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>
            {value}
            {sub && (
              <span className="ml-1 text-[10px] font-normal text-[var(--text-muted)]">
                {sub}
              </span>
            )}
          </span>
        </div>
        {bar && <div className="mt-1.5"><Bar value={bar.value} max={bar.max} color={color} /></div>}
      </div>
    </div>
  );
}

export function RPGStatSheet({ stats }: { stats: RPGStats }) {
  const xpForNext = Math.pow(2, (stats.level + 1) / 15) - 1;

  return (
    <div className="rounded-lg border border-[var(--purple)]/10 bg-[var(--surface)] p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--text)]">
            Character Sheet
          </div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            Level {stats.level} {stats.className} {stats.classEmoji}
          </div>
        </div>
        <span className="rounded border border-[var(--purple)]/20 bg-[var(--purple)]/5 px-2 py-0.5 text-xs font-medium text-[var(--purple)]">
          {stats.title}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <StatRow
          icon={<Swords size={14} />}
          label="Experience"
          value={stats.xp.toLocaleString()}
          sub="XP"
          color="var(--accent)"
          bar={{ value: stats.xp, max: xpForNext }}
        />
        <StatRow
          icon={<Heart size={14} />}
          label="Stamina"
          value={`${stats.stamina}/${stats.maxStamina}`}
          color="var(--green)"
          bar={{ value: stats.stamina, max: stats.maxStamina }}
        />
        <StatRow
          icon={<Users size={14} />}
          label="Guild"
          value={stats.guildContributions}
          sub="repos"
          color="var(--amber)"
        />
        <StatRow
          icon={<Shield size={14} />}
          label="Power"
          value={stats.level * 10}
          sub="score"
          color="var(--purple)"
        />
      </div>
    </div>
  );
}
