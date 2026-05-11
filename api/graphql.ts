import type { VercelRequest, VercelResponse } from "@vercel/node";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
query($username: String!) {
  user(login: $username) {
    createdAt
    contributionsCollection {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Missing 'username' query parameter" });
  }

  if (!process.env.GITHUB_PAT) {
    return res.status(500).json({ error: "Server misconfigured: missing token" });
  }

  try {
    const response = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "DevPulse",
      },
      body: JSON.stringify({
        query: CONTRIBUTIONS_QUERY,
        variables: { username },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(400).json({ error: data.errors[0]?.message ?? "GraphQL error" });
    }

    if (!data.data?.user) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = data.data.user;
    const collection = user.contributionsCollection;
    const calendar = collection.contributionCalendar;

    // Calendar aggregations
    const dailyContributions: Record<string, number> = {};
    const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
    let weeksWithActivity = 0;
    const monthlyTotals: Record<string, number> = {};
    let firstActiveDate: string | null = null;
    let lastActiveDate: string | null = null;

    for (const week of calendar.weeks) {
      let weekHasActivity = false;
      for (const day of week.contributionDays) {
        dailyContributions[day.date] = day.contributionCount;
        dayOfWeekTotals[day.weekday] += day.contributionCount;
        if (day.contributionCount > 0) {
          weekHasActivity = true;
          if (!firstActiveDate) firstActiveDate = day.date;
          lastActiveDate = day.date;
        }
        const month = day.date.slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] ?? 0) + day.contributionCount;
      }
      if (weekHasActivity) weeksWithActivity++;
    }

    const totalWeeks = calendar.weeks.length;

    // ── Language signal ──
    // We count *user commits* per repo's primary language. That maps cleanly
    // to "what the user spent their time writing this year." It avoids the
    // trap of attributing a huge repo's total byte count to a contributor who
    // only made a handful of commits.
    const commitRepos: CommitContrib[] = collection.commitContributionsByRepository ?? [];

    const langCommits = new Map<
      string,
      { commits: number; repos: number; color: string | null }
    >();

    let homeBase: {
      nameWithOwner: string;
      url: string;
      commits: number;
      primaryLanguage: string | null;
      primaryLanguageColor: string | null;
    } | null = null;

    let starsEarned = 0;
    let ownedReposContributed = 0;

    for (const c of commitRepos) {
      const repo = c.repository;
      const commits = c.contributions.totalCount;

      // Home base: most-committed repo regardless of ownership.
      if (!homeBase || commits > homeBase.commits) {
        homeBase = {
          nameWithOwner: repo.nameWithOwner,
          url: repo.url,
          commits,
          primaryLanguage: repo.primaryLanguage?.name ?? null,
          primaryLanguageColor: repo.primaryLanguage?.color ?? null,
        };
      }

      // Stars earned: only repos the user actually owns (and didn't fork).
      const isOwn = repo.owner.login.toLowerCase() === username.toLowerCase();
      if (isOwn && !repo.isFork) {
        starsEarned += repo.stargazerCount ?? 0;
        ownedReposContributed += 1;
      }

      // Language attribution by commit count, primary language only.
      // Skip repos with no primary language (empty / config-only repos).
      if (!repo.primaryLanguage) continue;
      const name = repo.primaryLanguage.name;
      const existing = langCommits.get(name) ?? {
        commits: 0,
        repos: 0,
        color: repo.primaryLanguage.color ?? null,
      };
      existing.commits += commits;
      existing.repos += 1;
      langCommits.set(name, existing);
    }

    const languages = [...langCommits.entries()]
      .map(([language, v]) => ({
        language,
        commits: v.commits,
        repoCount: v.repos,
        color: v.color,
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 12);

    const reposCreatedThisYear = collection.totalRepositoryContributions ?? 0;
    const reposContributedTo = collection.totalRepositoriesWithContributedCommits ?? 0;

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
      languages,
      homeBase,
      reposCreatedThisYear,
      reposContributedTo,
      ownedReposContributed,
      starsEarned,
      userCreatedAt: user.createdAt,
    });
  } catch {
    return res.status(502).json({ error: "Failed to fetch from GitHub GraphQL API" });
  }
}
