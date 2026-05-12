import { kv } from "@vercel/kv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 15; // per IP per minute

export function getIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (ip ?? req.socket?.remoteAddress ?? "unknown").trim();
}

/**
 * Returns true if the request should be blocked (rate limit exceeded).
 * Falls back to allowing the request if KV is unavailable.
 */
export async function isRateLimited(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  try {
    const ip = getIp(req);
    const key = `rl:${ip}`;
    const hits = await kv.incr(key);
    if (hits === 1) await kv.expire(key, WINDOW_SECONDS);
    if (hits > MAX_REQUESTS) {
      res.setHeader("Retry-After", String(WINDOW_SECONDS));
      res.status(429).json({ error: "Too many requests, slow down." });
      return true;
    }
  } catch {
    // KV unavailable — fail open rather than blocking legit traffic
  }
  return false;
}

const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

export function isValidUsername(username: unknown): username is string {
  return typeof username === "string" && USERNAME_RE.test(username);
}
