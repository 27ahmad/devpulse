import type { ContributionData } from "../hooks/useContributions";
import type { LanguageStat } from "../hooks/useLanguageMastery";
import type { GitHubUser } from "../hooks/useGitHubUser";
import { computeStreaks } from "./streaks";

export type ArchetypeName =
  | "Specialist"
  | "Polyglot"
  | "Collaborator"
  | "Solo Builder"
  | "Maintainer"
  | "Sprinter"
  | "Marathoner"
  | "Weekend Hacker"
  | "Quiet Year";

export interface Archetype {
  name: ArchetypeName;
  tagline: string;
}

export interface Insights {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  consistency: number;

  activeDays: number;
  velocity: number;
  recency30: number;

  specializationPct: number;
  languageDiversity: number;
  languagesUsedCount: number;
  primaryLanguage: string | null;

  weekdayWeekendRatio: number;
  peakDay: string;
  peakDayIndex: number;

  collabShare: number;

  bestMonth: { label: string; count: number } | null;

  currentStreak: number;
  longestStreak: number;

  archetype: Archetype;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function shannonEntropy(shares: number[]): number {
  let h = 0;
  for (const p of shares) {
    if (p > 0) h -= p * Math.log(p);
  }
  return h;
}

function deriveArchetype(i: Omit<Insights, "archetype">): Archetype {
  if (i.totalContributions < 30) {
    return {
      name: "Quiet Year",
      tagline: `A reflective year — ${i.totalContributions} contributions, with room to grow.`,
    };
  }

  if (i.reviews >= Math.max(i.pullRequests, 1) && i.collabShare >= 0.15) {
    return {
      name: "Maintainer",
      tagline: `${i.reviews} reviews vs ${i.pullRequests} PRs — you spend more time guiding code than writing it.`,
    };
  }

  if (i.collabShare < 0.05 && i.commits / Math.max(i.totalContributions, 1) >= 0.8) {
    return {
      name: "Solo Builder",
      tagline: `${Math.round((i.commits / i.totalContributions) * 100)}% of your activity was commits — heads down, building.`,
    };
  }

  if (i.collabShare >= 0.25) {
    return {
      name: "Collaborator",
      tagline: `${Math.round(i.collabShare * 100)}% of your year was PRs and reviews — a team player.`,
    };
  }

  if (i.specializationPct >= 0.7 && i.primaryLanguage) {
    return {
      name: "Specialist",
      tagline: `${Math.round(i.specializationPct * 100)}% of your code was ${i.primaryLanguage}. You went deep.`,
    };
  }

  if (i.languageDiversity >= 1.5) {
    return {
      name: "Polyglot",
      tagline: `${i.languagesUsedCount} languages, spread evenly. Range over depth.`,
    };
  }

  if (i.velocity >= 5 && i.consistency < 60) {
    return {
      name: "Sprinter",
      tagline: `${i.velocity.toFixed(1)} contributions per active day — but you don't show up every week.`,
    };
  }

  if (i.consistency >= 80 && i.velocity < 3) {
    return {
      name: "Marathoner",
      tagline: `Active in ${i.consistency}% of weeks — slow and relentless.`,
    };
  }

  if (i.weekdayWeekendRatio < 1.5) {
    return {
      name: "Weekend Hacker",
      tagline: `Weekends pulled almost as much weight as weekdays. Code on your own time.`,
    };
  }

  // Fallback: pick whichever of specialization / collaboration / cadence is strongest.
  if (i.specializationPct >= 0.5 && i.primaryLanguage) {
    return {
      name: "Specialist",
      tagline: `${Math.round(i.specializationPct * 100)}% of your code was ${i.primaryLanguage}.`,
    };
  }
  return {
    name: "Solo Builder",
    tagline: `${i.totalContributions.toLocaleString()} contributions across ${i.activeDays} days.`,
  };
}

export function computeInsights(args: {
  user: GitHubUser;
  contributions: ContributionData;
  languages: LanguageStat[];
}): Insights {
  const { contributions: c, languages } = args;

  const activeDays = Object.values(c.dailyContributions).filter((v) => v > 0).length;
  const velocity = activeDays > 0 ? c.totalContributions / activeDays : 0;

  // recency30 — sum of last 30 calendar days
  const sortedDates = Object.keys(c.dailyContributions).sort();
  const recencyWindow = sortedDates.slice(-30);
  const recency30 = recencyWindow.reduce(
    (s, d) => s + (c.dailyContributions[d] ?? 0),
    0
  );

  const totalBytes = languages.reduce((s, l) => s + l.bytes, 0);
  const primaryLanguage = languages[0]?.language ?? null;
  const specializationPct = totalBytes > 0 && languages[0]
    ? languages[0].bytes / totalBytes
    : 0;

  const significant = languages.filter((l) =>
    totalBytes > 0 ? l.bytes / totalBytes >= 0.01 : false
  );
  const shares = significant.map((l) => l.bytes / totalBytes);
  const languageDiversity = shannonEntropy(shares);

  const weekdaySum =
    c.dayOfWeekTotals[1] +
    c.dayOfWeekTotals[2] +
    c.dayOfWeekTotals[3] +
    c.dayOfWeekTotals[4] +
    c.dayOfWeekTotals[5];
  const weekendSum = c.dayOfWeekTotals[0] + c.dayOfWeekTotals[6];
  const weekdayWeekendRatio = weekendSum > 0 ? weekdaySum / weekendSum : weekdaySum > 0 ? 99 : 0;

  const peakDayIndex = c.dayOfWeekTotals.indexOf(Math.max(...c.dayOfWeekTotals));
  const peakDay = DAY_NAMES[peakDayIndex] ?? "Monday";

  const collabShare =
    c.totalContributions > 0
      ? (c.pullRequests + c.reviews) / c.totalContributions
      : 0;

  let bestMonth: { label: string; count: number } | null = null;
  for (const [key, count] of Object.entries(c.monthlyTotals)) {
    if (!bestMonth || count > bestMonth.count) {
      const month = parseInt(key.split("-")[1], 10) - 1;
      bestMonth = { label: MONTH_NAMES[month] ?? key, count };
    }
  }

  const streaks = computeStreaks(c.dailyContributions, new Date().getTimezoneOffset());

  const base = {
    totalContributions: c.totalContributions,
    commits: c.commits,
    pullRequests: c.pullRequests,
    reviews: c.reviews,
    issues: c.issues,
    consistency: c.consistency,
    activeDays,
    velocity,
    recency30,
    specializationPct,
    languageDiversity,
    languagesUsedCount: significant.length,
    primaryLanguage,
    weekdayWeekendRatio,
    peakDay,
    peakDayIndex,
    collabShare,
    bestMonth,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
  };

  return { ...base, archetype: deriveArchetype(base) };
}
