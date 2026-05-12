import type { VercelRequest, VercelResponse } from "@vercel/node";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;

const store = new Map<string, { count: number; resetAt: number }>();

function getIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (raw ?? "unknown").trim();
}

export function isRateLimited(req: VercelRequest, res: VercelResponse): boolean {
  const ip = getIp(req);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "Too many requests, slow down." });
    return true;
  }

  return false;
}

export const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

export function isValidUsername(username: unknown): username is string {
  return typeof username === "string" && USERNAME_RE.test(username);
}
