export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export function computeStreaks(
  dailyCommits: Record<string, number>,
  timezoneOffset: number
): StreakResult {
  const dates = Object.keys(dailyCommits).sort();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date();
  today.setMinutes(today.getMinutes() - timezoneOffset);
  const todayStr = today.toISOString().slice(0, 10);

  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates) {
    if (dailyCommits[dateStr] === 0) continue;

    const date = new Date(dateStr + "T00:00:00Z");
    if (prevDate) {
      const diffDays = Math.round(
        (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    prevDate = date;
  }

  // Check if current streak is still active (last activity today or yesterday)
  if (prevDate) {
    const lastDateStr = dates[dates.length - 1];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDateStr !== todayStr && lastDateStr !== yesterdayStr) {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}
