import type { RPGStats } from "../utils/gamify";

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#30363d]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function RPGStatSheet({ stats }: { stats: RPGStats }) {
  const xpForNext = Math.pow(2, (stats.level + 1) / 15) - 1;
  const xpProgress = Math.min((stats.xp / xpForNext) * 100, 100);

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">RPG Stat Sheet</h3>
        <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs text-[#7d8590]">
          {stats.title}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#0d1117] text-3xl">
          {stats.classEmoji}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-white">
            Level {stats.level} {stats.className}
          </div>
          <div className="mt-1 text-xs text-[#7d8590]">
            {stats.xp.toLocaleString()} XP
          </div>
          <div className="mt-1.5">
            <ProgressBar value={xpProgress} max={100} color="#58a6ff" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-[#7d8590]">Stamina</div>
          <div className="mt-1 text-sm font-semibold text-[#3fb950]">
            {stats.stamina}/{stats.maxStamina}
          </div>
          <div className="mt-1">
            <ProgressBar
              value={stats.stamina}
              max={stats.maxStamina}
              color="#3fb950"
            />
          </div>
        </div>
        <div>
          <div className="text-xs text-[#7d8590]">Guild</div>
          <div className="mt-1 text-sm font-semibold text-[#d29922]">
            {stats.guildContributions}
          </div>
          <div className="mt-0.5 text-xs text-[#484f58]">repos</div>
        </div>
        <div>
          <div className="text-xs text-[#7d8590]">Power</div>
          <div className="mt-1 text-sm font-semibold text-[#bc8cff]">
            {stats.level * 10}
          </div>
          <div className="mt-0.5 text-xs text-[#484f58]">score</div>
        </div>
      </div>
    </div>
  );
}
