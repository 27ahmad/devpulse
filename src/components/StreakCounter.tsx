import type { StreakResult } from "../utils/streaks";

export function StreakCounter({ streak }: { streak: StreakResult }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-center">
        <div className="text-3xl font-bold text-[#3fb950]">
          {streak.currentStreak}
        </div>
        <div className="mt-1 text-xs text-[#7d8590]">Current Streak</div>
        <div className="mt-0.5 text-xs text-[#484f58]">days</div>
      </div>
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-center">
        <div className="text-3xl font-bold text-[#58a6ff]">
          {streak.longestStreak}
        </div>
        <div className="mt-1 text-xs text-[#7d8590]">Longest Streak</div>
        <div className="mt-0.5 text-xs text-[#484f58]">days</div>
      </div>
    </div>
  );
}
