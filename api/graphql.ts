import type { VercelRequest, VercelResponse } from "@vercel/node";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const CONTRIBUTIONS_QUERY = `
query($username: String!) {
  user(login: $username) {
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
    }
  }
}
`;

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

    const collection = data.data.user.contributionsCollection;
    const calendar = collection.contributionCalendar;

    const dailyContributions: Record<string, number> = {};
    const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
    let weeksWithActivity = 0;
    const monthlyTotals: Record<string, number> = {};

    for (const week of calendar.weeks) {
      let weekHasActivity = false;
      for (const day of week.contributionDays) {
        dailyContributions[day.date] = day.contributionCount;
        dayOfWeekTotals[day.weekday] += day.contributionCount;
        if (day.contributionCount > 0) weekHasActivity = true;

        const month = day.date.slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] ?? 0) + day.contributionCount;
      }
      if (weekHasActivity) weeksWithActivity++;
    }

    const totalWeeks = calendar.weeks.length;

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
    });
  } catch {
    return res.status(502).json({ error: "Failed to fetch from GitHub GraphQL API" });
  }
}
