import type { VercelRequest, VercelResponse } from "@vercel/node";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;
const ipStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: VercelRequest, res: VercelResponse): boolean {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ?? "unknown";
  const now = Date.now();
  const entry = ipStore.get(ip);
  if (!entry || now > entry.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    res.status(429).json({ error: "Too many requests." });
    return true;
  }
  return false;
}

const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const TOP_N_FOR_WEIGHTING = 5;

const CONTRIBUTIONS_QUERY = `
query($username: String!) {
  user(login: $username) {
    createdAt
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
          }
        }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      totalRepositoriesWithContributedCommits
      commitContributionsByRepository(maxRepositories: 100) {
        contributions { totalCount }
        repository {
          nameWithOwner
          url
          isPrivate
          isFork
          stargazerCount
          owner { login }
          primaryLanguage { name color }
        }
      }
      pullRequestContributions(first: 100) {
        nodes {
          pullRequest {
            additions
            deletions
            changedFiles
            merged
          }
        }
      }
      totalRepositoryContributions
    }
  }
}
`;

const CONTRIBUTIONS_VIEWER_QUERY = `
query {
  viewer {
    createdAt
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            weekday
          }
        }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      totalRepositoriesWithContributedCommits
      commitContributionsByRepository(maxRepositories: 100) {
        contributions { totalCount }
        repository {
          nameWithOwner
          url
          isPrivate
          isFork
          stargazerCount
          owner { login }
          primaryLanguage { name color }
        }
      }
      pullRequestContributions(first: 100) {
        nodes {
          pullRequest {
            additions
            deletions
            changedFiles
            merged
          }
        }
      }
      totalRepositoryContributions
    }
  }
}
`;

interface CommitContrib {
  contributions: { totalCount: number };
  repository: {
    nameWithOwner: string;
    url: string;
    isPrivate: boolean;
    isFork: boolean;
    stargazerCount: number;
    owner: { login: string };
    primaryLanguage: { name: string; color: string } | null;
  };
}

interface PullRequestContrib {
  pullRequest: {
    additions: number;
    deletions: number;
    changedFiles: number;
    merged: boolean;
  } | null;
}

async function fetchRepoLanguages(
  nameWithOwner: string,
  token: string
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${nameWithOwner}/languages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "DevPulse",
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as Record<string, number>;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (checkRateLimit(req, res)) return;

  const { username } = req.query;

  if (!username || typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Invalid or missing 'username' parameter" });
  }

  const authHeader = req.headers.authorization;
  const isBearer = authHeader && /^bearer\s+/i.test(authHeader);
  const token = isBearer
    ? authHeader.split(/\s+/)[1]
    : process.env.GITHUB_PAT;

  if (!token) {
    return res.status(500).json({ error: "Server misconfigured: missing token" });
  }

  // 1. Verify if the token owner matches the queried username to unlock private viewer query
  let isViewerQuery = false;
  if (isBearer) {
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "DevPulse",
          Accept: "application/vnd.github+json",
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData && userData.login && userData.login.toLowerCase() === username.toLowerCase()) {
          isViewerQuery = true;
        }
      }
    } catch {
      // Ignore and fallback to standard public user query
    }
  }

  try {
    const query = isViewerQuery ? CONTRIBUTIONS_VIEWER_QUERY : CONTRIBUTIONS_QUERY;
    const variables = isViewerQuery ? {} : { username };

    const response = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "DevPulse",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({ error: data.errors[0]?.message ?? "GraphQL error" });
    }

    const user = isViewerQuery ? data.data?.viewer : data.data?.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const collection = user.contributionsCollection;
    const calendar = collection.contributionCalendar;

    // ── Calendar aggregations ──
    const dailyContributions: Record<string, number> = {};
    const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
    let weeksWithActivity = 0;
    const monthlyTotals: Record<string, number> = {};
    let firstActiveDate: string | null = null;
    let lastActiveDate: string | null = null;
    let bestDay: { date: string; count: number } | null = null;

    for (const week of calendar.weeks) {
      let weekHasActivity = false;
      for (const day of week.contributionDays) {
        dailyContributions[day.date] = day.contributionCount;
        dayOfWeekTotals[day.weekday] += day.contributionCount;
        if (day.contributionCount > 0) {
          weekHasActivity = true;
          if (!firstActiveDate) firstActiveDate = day.date;
          lastActiveDate = day.date;
          if (!bestDay || day.contributionCount > bestDay.count) {
            bestDay = { date: day.date, count: day.contributionCount };
          }
        }
        const month = day.date.slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] ?? 0) + day.contributionCount;
      }
      if (weekHasActivity) weeksWithActivity++;
    }

    const totalWeeks = calendar.weeks.length;

    // Best 7-day window
    const sortedDates = Object.keys(dailyContributions).sort();
    let bestWeek: { weekStartDate: string; count: number } | null = null;
    if (sortedDates.length >= 7) {
      let windowSum = 0;
      for (let i = 0; i < 7; i++) windowSum += dailyContributions[sortedDates[i]] ?? 0;
      bestWeek = { weekStartDate: sortedDates[0], count: windowSum };
      for (let i = 7; i < sortedDates.length; i++) {
        windowSum += dailyContributions[sortedDates[i]] ?? 0;
        windowSum -= dailyContributions[sortedDates[i - 7]] ?? 0;
        if (windowSum > bestWeek.count) {
          bestWeek = { weekStartDate: sortedDates[i - 6], count: windowSum };
        }
      }
    }

    // ── Commit-repo loop: home base, stars, top repos, language attribution ──
    const commitRepos: CommitContrib[] = collection.commitContributionsByRepository ?? [];
    const sortedByCommits = [...commitRepos].sort(
      (a, b) => b.contributions.totalCount - a.contributions.totalCount
    );

    // Fetch byte-level language data for the top N repos in parallel
    const weightingTargets = sortedByCommits.slice(0, TOP_N_FOR_WEIGHTING);
    const weightingResults = await Promise.all(
      weightingTargets.map((r) => fetchRepoLanguages(r.repository.nameWithOwner, token))
    );
    const byteMixByRepo = new Map<string, Record<string, number>>();
    weightingTargets.forEach((r, i) => {
      const result = weightingResults[i];
      if (result && Object.keys(result).length > 0) {
        byteMixByRepo.set(r.repository.nameWithOwner, result);
      }
    });

    const langCommits = new Map<
      string,
      { commits: number; repos: number; color: string | null }
    >();

    let starsEarned = 0;
    let ownedReposContributed = 0;

    for (const c of commitRepos) {
      const repo = c.repository;
      const commits = c.contributions.totalCount;

      // Stars: only repos the user actually owns (and didn't fork).
      const isOwn = repo.owner.login.toLowerCase() === username.toLowerCase();
      if (isOwn && !repo.isFork) {
        starsEarned += repo.stargazerCount ?? 0;
        ownedReposContributed += 1;
      }

      // Language attribution: weighted by byte mix for top N, primary-only for the long tail.
      const byteMix = byteMixByRepo.get(repo.nameWithOwner);
      if (byteMix) {
        const totalBytes = Object.values(byteMix).reduce((s, v) => s + v, 0);
        for (const [lang, bytes] of Object.entries(byteMix)) {
          const share = bytes / totalBytes;
          const attributed = commits * share;
          const existing = langCommits.get(lang) ?? {
            commits: 0,
            repos: 0,
            color: null,
          };
          existing.commits += attributed;
          existing.repos += 1;
          langCommits.set(lang, existing);
        }
      } else if (repo.primaryLanguage) {
        const name = repo.primaryLanguage.name;
        const existing = langCommits.get(name) ?? {
          commits: 0,
          repos: 0,
          color: repo.primaryLanguage.color ?? null,
        };
        existing.commits += commits;
        existing.repos += 1;
        if (!existing.color && repo.primaryLanguage.color) {
          existing.color = repo.primaryLanguage.color;
        }
        langCommits.set(name, existing);
      }
    }

    const languages = [...langCommits.entries()]
      .map(([language, v]) => ({
        language,
        commits: Math.round(v.commits),
        repoCount: v.repos,
        color: v.color,
      }))
      .filter((l) => l.commits > 0)
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 12);

    // Top 3 repos by commits (for dashboard list + story home base)
    const topRepos = sortedByCommits.slice(0, 3).map((c) => ({
      nameWithOwner: c.repository.nameWithOwner,
      url: c.repository.url,
      commits: c.contributions.totalCount,
      primaryLanguage: c.repository.primaryLanguage?.name ?? null,
      primaryLanguageColor: c.repository.primaryLanguage?.color ?? null,
    }));
    const homeBase = topRepos[0] ?? null;

    // ── PR size aggregation ──
    const prNodes: PullRequestContrib[] =
      collection.pullRequestContributions?.nodes ?? [];
    let prAdditions = 0;
    let prDeletions = 0;
    let prChangedFiles = 0;
    let prMerged = 0;
    let prSampleCount = 0;
    for (const node of prNodes) {
      const pr = node.pullRequest;
      if (!pr) continue;
      prAdditions += pr.additions ?? 0;
      prDeletions += pr.deletions ?? 0;
      prChangedFiles += pr.changedFiles ?? 0;
      if (pr.merged) prMerged += 1;
      prSampleCount += 1;
    }

    const reposCreatedThisYear = collection.totalRepositoryContributions ?? 0;
    const reposContributedTo = collection.totalRepositoriesWithContributedCommits ?? 0;
    const restrictedContributions = collection.restrictedContributionsCount ?? 0;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      totalContributions: calendar.totalContributions,
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      reviews: collection.totalPullRequestReviewContributions,
      issues: collection.totalIssueContributions,
      dailyContributions,
      dayOfWeekTotals,
      monthlyTotals,
      consistency: totalWeeks > 0 ? Math.round((weeksWithActivity / totalWeeks) * 100) : 0,
      totalWeeks,
      weeksWithActivity,
      firstActiveDate,
      lastActiveDate,
      bestDay,
      bestWeek,
      languages,
      homeBase,
      topRepos,
      reposCreatedThisYear,
      reposContributedTo,
      ownedReposContributed,
      starsEarned,
      restrictedContributions,
      prAdditions,
      prDeletions,
      prChangedFiles,
      prMerged,
      prSampleCount,
      userCreatedAt: user.createdAt,
    });
  } catch {
    return res.status(502).json({ error: "Failed to fetch from GitHub GraphQL API" });
  }
}
