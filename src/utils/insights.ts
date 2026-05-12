import type {
  ContributionData,
  DayMark,
  HomeBase,
  LanguageStat,
  RepoRef,
  WeekMark,
} from "../hooks/useContributions";
import type { GitHubUser } from "./../hooks/useGitHubUser";
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
  daysSinceLastActive: number | null;

  specializationPct: number;
  languageDiversity: number;
  languagesUsedCount: number;
  primaryLanguage: string | null;
  languages: LanguageStat[];

  weekdayWeekendRatio: number;
  peakDay: string;
  peakDayIndex: number;

  collabShare: number;

  bestMonth: { label: string; count: number; aboveAverage: number } | null;
  bestDay: DayMark | null;
  bestWeek: WeekMark | null;

  currentStreak: number;
  longestStreak: number;

  firstActiveDate: string | null;
  lastActiveDate: string | null;
  homeBase: HomeBase | null;
  topRepos: RepoRef[];
  reposCreatedThisYear: number;
  reposContributedTo: number;
  starsEarned: number;
  restrictedContributions: number;
  yearsOnGitHub: number;

  prAdditions: number;
  prDeletions: number;
  prChangedFiles: number;
  prMerged: number;
  prSampleCount: number;

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

function daysBetween(a: string, b: Date): number {
  const ms = b.getTime() - new Date(a).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function deriveArchetype(
  i: Omit<Insights, "archetype">
): Archetype {
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
}): Insights {
  const { contributions: c } = args;
  const languages = c.languages;

  const activeDays = Object.values(c.dailyContributions).filter((v) => v > 0).length;
  const velocity = activeDays > 0 ? c.totalContributions / activeDays : 0;

  const sortedDates = Object.keys(c.dailyContributions).sort();
  const recencyWindow = sortedDates.slice(-30);
  const recency30 = recencyWindow.reduce(
    (s, d) => s + (c.dailyContributions[d] ?? 0),
    0
  );

  const daysSinceLastActive = c.lastActiveDate
    ? daysBetween(c.lastActiveDate, new Date())
    : null;

  const totalLangCommits = languages.reduce((s, l) => s + l.commits, 0);
  const primaryLanguage = languages[0]?.language ?? null;
  const specializationPct =
    totalLangCommits > 0 && languages[0]
      ? languages[0].commits / totalLangCommits
      : 0;

  const significant = languages.filter((l) =>
    totalLangCommits > 0 ? l.commits / totalLangCommits >= 0.01 : false
  );
  const shares = significant.map((l) => l.commits / totalLangCommits);
  const languageDiversity = shannonEntropy(shares);

  const weekdaySum =
    c.dayOfWeekTotals[1] + c.dayOfWeekTotals[2] + c.dayOfWeekTotals[3] + c.dayOfWeekTotals[4] + c.dayOfWeekTotals[5];
  const weekendSum = c.dayOfWeekTotals[0] + c.dayOfWeekTotals[6];
  const weekdayWeekendRatio =
    weekendSum > 0 ? weekdaySum / weekendSum : weekdaySum > 0 ? 99 : 0;

  const peakDayIndex = c.dayOfWeekTotals.indexOf(Math.max(...c.dayOfWeekTotals));
  const peakDay = DAY_NAMES[peakDayIndex] ?? "Monday";

  const collabShare =
    c.totalContributions > 0
      ? (c.pullRequests + c.reviews) / c.totalContributions
      : 0;

  // Best month with "above average" delta
  let bestMonth: { label: string; count: number; aboveAverage: number } | null = null;
  const monthEntries = Object.entries(c.monthlyTotals);
  if (monthEntries.length > 0) {
    const counts = monthEntries.map(([, n]) => n);
    const avg = counts.reduce((s, n) => s + n, 0) / counts.length;
    for (const [key, count] of monthEntries) {
      if (!bestMonth || count > bestMonth.count) {
        const month = parseInt(key.split("-")[1], 10) - 1;
        bestMonth = {
          label: MONTH_NAMES[month] ?? key,
          count,
          aboveAverage: avg > 0 ? (count - avg) / avg : 0,
        };
      }
    }
  }

  const streaks = computeStreaks(c.dailyContributions, new Date().getTimezoneOffset());

  const yearsOnGitHub = Math.max(
    0,
    new Date().getFullYear() - new Date(c.userCreatedAt).getFullYear()
  );

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
    daysSinceLastActive,
    specializationPct,
    languageDiversity,
    languagesUsedCount: significant.length,
    primaryLanguage,
    languages,
    weekdayWeekendRatio,
    peakDay,
    peakDayIndex,
    collabShare,
    bestMonth,
    bestDay: c.bestDay,
    bestWeek: c.bestWeek,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    firstActiveDate: c.firstActiveDate,
    lastActiveDate: c.lastActiveDate,
    homeBase: c.homeBase,
    topRepos: c.topRepos ?? [],
    reposCreatedThisYear: c.reposCreatedThisYear,
    reposContributedTo: c.reposContributedTo,
    starsEarned: c.starsEarned,
    restrictedContributions: c.restrictedContributions ?? 0,
    yearsOnGitHub,
    prAdditions: c.prAdditions ?? 0,
    prDeletions: c.prDeletions ?? 0,
    prChangedFiles: c.prChangedFiles ?? 0,
    prMerged: c.prMerged ?? 0,
    prSampleCount: c.prSampleCount ?? 0,
  };

  return { ...base, archetype: deriveArchetype(base) };
}
