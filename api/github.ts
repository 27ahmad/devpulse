import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isRateLimited } from "../src/lib/rateLimit";

const GITHUB_API = "https://api.github.com";

const ALLOWED_ENDPOINTS = [
  "users",
  "repos",
  "events",
  "languages",
] as const;

function isAllowedPath(path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  return segments.some((s) =>
    ALLOWED_ENDPOINTS.includes(s as (typeof ALLOWED_ENDPOINTS)[number])
  );
}

async function fetchWithBackoff(
  url: string,
  headers: Record<string, string>,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 403 || res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      const wait = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  return fetch(url, { headers });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path, per_page, page, sort, type } = req.query;

  if (isRateLimited(req, res)) return;

  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing 'path' query parameter" });
  }

  if (!isAllowedPath(path)) {
    return res.status(400).json({ error: "Endpoint not allowed" });
  }

  const params = new URLSearchParams();
  if (per_page) params.set("per_page", String(per_page));
  if (page) params.set("page", String(page));
  if (sort) params.set("sort", String(sort));
  if (type) params.set("type", String(type));

  const url = `${GITHUB_API}/${path}${params.toString() ? `?${params}` : ""}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DevPulse",
  };

  if (process.env.GITHUB_PAT) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PAT}`;
  }

  try {
    const response = await fetchWithBackoff(url, headers);
    const data = await response.json();

    const rateLimit = response.headers.get("x-ratelimit-remaining");
    const rateReset = response.headers.get("x-ratelimit-reset");

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    if (rateLimit) res.setHeader("X-RateLimit-Remaining", rateLimit);
    if (rateReset) res.setHeader("X-RateLimit-Reset", rateReset);

    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ error: "Failed to fetch from GitHub API" });
  }
}
