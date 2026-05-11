import type { VercelRequest, VercelResponse } from "@vercel/node";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

// Single round-trip: calendar + totals + per-repo commit contributions w/
// languages + repos created this year. Anything else we need is here.
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
          stargazerCount
          primaryLanguage { name color }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node { name color }
            }
          }
        }
      }
      totalRepositoryContributions
      repositoryContributions(first: 20) {
        nodes {
          repository {
            nameWithOwner
            createdAt
            isPrivate
          }
        }
      }
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
    stargazerCount: number;
    primaryLanguage: { name: string; color: string } | null;
    languages: {
      edges: Array<{
        size: number;
        node: { name: string; color: string | null };
      }>;
    };
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

    // Past-year language aggregation, weighted by commits per repo.
    // GitHub gives us each repo's full language byte breakdown; we attribute
    // those bytes to the user's year proportional to how much they committed.
    const langTotals = new Map<
      string,
      { bytes: number; repos: number; color: string | null }
    >();
    const commitRepos: CommitContrib[] = collection.commitContributionsByRepository ?? [];
    const totalCommitsAcrossRepos =
      commitRepos.reduce((s, r) => s + r.contributions.totalCount, 0) || 1;

    let homeBase: {
      nameWithOwner: string;
      url: string;
      commits: number;
      primaryLanguage: string | null;
      primaryLanguageColor: string | null;
    } | null = null;

    let starsEarned = 0;

    for (const c of commitRepos) {
      const repo = c.repository;
      const commits = c.contributions.totalCount;
      starsEarned += repo.stargazerCount ?? 0;

      if (!homeBase || commits > homeBase.commits) {
        homeBase = {
          nameWithOwner: repo.nameWithOwner,
          url: repo.url,
          commits,
          primaryLanguage: repo.primaryLanguage?.name ?? null,
          primaryLanguageColor: repo.primaryLanguage?.color ?? null,
        };
      }

      // Skip repos with no language data (probably empty/private placeholders)
      const totalRepoBytes = repo.languages.edges.reduce((s, e) => s + e.size, 0);
      if (totalRepoBytes === 0) continue;

      const commitShare = commits / totalCommitsAcrossRepos;
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        const attributedBytes = edge.size * commitShare;
        const existing = langTotals.get(name) ?? {
          bytes: 0,
          repos: 0,
          color: edge.node.color,
        };
        existing.bytes += attributedBytes;
        existing.repos += 1;
        if (!existing.color && edge.node.color) existing.color = edge.node.color;
        langTotals.set(name, existing);
      }
    }

    const languages = [...langTotals.entries()]
      .map(([language, v]) => ({
        language,
        bytes: Math.round(v.bytes),
        repoCount: v.repos,
        color: v.color,
      }))
      .sort((a, b) => b.bytes - a.bytes)
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
      starsEarned,
      userCreatedAt: user.createdAt,
    });
  } catch {
    return res.status(502).json({ error: "Failed to fetch from GitHub GraphQL API" });
  }
}
