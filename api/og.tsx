import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_REST = "https://api.github.com";

const CONTRIBUTIONS_QUERY = `
query($username: String!) {
  user(login: $username) {
    avatarUrl
    name
    login
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
    }
  }
}`;

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": "DevPulse-OG",
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_PAT) {
    h.Authorization = `Bearer ${process.env.GITHUB_PAT}`;
  }
  return h;
}

interface Snapshot {
  login: string;
  name: string;
  avatarUrl: string;
  totalContributions: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  activeDays: number;
  primaryLanguage: string | null;
  archetype: { name: string; tagline: string };
  languagesUsedCount: number;
  longestStreak: number;
}

async function fetchSnapshot(username: string): Promise<Snapshot> {
  const gqlRes = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { username },
    }),
  });
  const gqlData = await gqlRes.json();
  if (!gqlData?.data?.user) throw new Error("User not found");
  const u = gqlData.data.user;
  const cal = u.contributionsCollection.contributionCalendar;

  let activeDays = 0;
  const totalContributions = cal.totalContributions;
  // Longest streak (light, since this runs in OG)
  let longest = 0;
  let cur = 0;
  for (const w of cal.weeks) {
    for (const d of w.contributionDays) {
      if (d.contributionCount > 0) {
        activeDays += 1;
        cur += 1;
        longest = Math.max(longest, cur);
      } else {
        cur = 0;
      }
    }
  }

  const commits = u.contributionsCollection.totalCommitContributions;
  const pullRequests = u.contributionsCollection.totalPullRequestContributions;
  const reviews = u.contributionsCollection.totalPullRequestReviewContributions;

  // Get top languages cheaply by reading repo `language` field
  const reposRes = await fetch(
    `${GITHUB_REST}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`,
    { headers: ghHeaders() }
  );
  const repos: Array<{ language: string | null; fork: boolean }> =
    reposRes.ok ? await reposRes.json() : [];
  const langCount = new Map<string, number>();
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  }
  const langTotal = [...langCount.values()].reduce((s, n) => s + n, 0);
  const top = [...langCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const primaryLanguage = top?.[0] ?? null;
  const specializationPct =
    top && langTotal > 0 ? top[1] / langTotal : 0;
  const languagesUsedCount = langCount.size;

  const collabShare =
    totalContributions > 0
      ? (pullRequests + reviews) / totalContributions
      : 0;

  // Lightweight archetype
  let archetype = { name: "Solo Builder", tagline: `${totalContributions.toLocaleString()} contributions across ${activeDays} days.` };
  if (totalContributions < 30) {
    archetype = { name: "Quiet Year", tagline: `A reflective year — ${totalContributions} contributions.` };
  } else if (reviews >= Math.max(pullRequests, 1) && collabShare >= 0.15) {
    archetype = { name: "Maintainer", tagline: `${reviews} reviews vs ${pullRequests} PRs.` };
  } else if (collabShare >= 0.25) {
    archetype = { name: "Collaborator", tagline: `${Math.round(collabShare * 100)}% of the year was PRs and reviews.` };
  } else if (specializationPct >= 0.7 && primaryLanguage) {
    archetype = { name: "Specialist", tagline: `${Math.round(specializationPct * 100)}% of code was ${primaryLanguage}.` };
  } else if (languagesUsedCount >= 5) {
    archetype = { name: "Polyglot", tagline: `${languagesUsedCount} languages, spread evenly.` };
  }

  return {
    login: u.login,
    name: u.name ?? u.login,
    avatarUrl: u.avatarUrl,
    totalContributions,
    commits,
    pullRequests,
    reviews,
    activeDays,
    primaryLanguage,
    archetype,
    languagesUsedCount,
    longestStreak: longest,
  };
}

function lighten(hex: string): { primary: string; accent: string; deep: string } {
  return { primary: hex, accent: hex, deep: "#0a0a12" };
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("user");

  if (!username || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(username)) {
    return new Response("Missing or invalid `user` parameter", { status: 400 });
  }

  let snap: Snapshot;
  try {
    snap = await fetchSnapshot(username);
  } catch {
    return new Response("Failed to render card", { status: 502 });
  }

  const baseColor = snap.primaryLanguage
    ? LANGUAGE_COLORS[snap.primaryLanguage] ?? "#8b5cf6"
    : "#8b5cf6";
  const palette = lighten(baseColor);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px 70px",
          background: `radial-gradient(ellipse at 20% 10%, ${palette.primary}55 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, ${palette.primary}33 0%, transparent 55%), #06060a`,
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img
            src={snap.avatarUrl}
            width={72}
            height={72}
            style={{ borderRadius: 36 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              DevPulse · {new Date().getFullYear()}
            </div>
            <div style={{ fontSize: 30, fontWeight: 600 }}>@{snap.login}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1,
              color: palette.primary,
            }}
          >
            {snap.archetype.name}
          </div>
          <div
            style={{
              fontSize: 24,
              marginTop: 22,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 900,
            }}
          >
            {snap.archetype.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: "auto",
          }}
        >
          {[
            { label: "Contributions", value: snap.totalContributions.toLocaleString() },
            { label: "Active days", value: snap.activeDays.toLocaleString() },
            { label: "Languages", value: snap.languagesUsedCount.toString() },
            { label: "Longest streak", value: `${snap.longestStreak}d` },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "20px 22px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 600 }}>{s.value}</div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
  return image;
}
