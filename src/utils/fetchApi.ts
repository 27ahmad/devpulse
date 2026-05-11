export class ApiError extends Error {
  status: number;
  rateLimitResetAt: number | null;

  constructor(message: string, status: number, rateLimitResetAt: number | null) {
    super(message);
    this.status = status;
    this.rateLimitResetAt = rateLimitResetAt;
  }
}

function readResetHeader(res: Response): number | null {
  const v = res.headers.get("X-RateLimit-Reset");
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n * 1000 : null;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (res.ok) return res.json() as Promise<T>;

  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    // ignore
  }

  if (res.status === 403 || res.status === 429) {
    const resetAt = readResetHeader(res);
    if (resetAt) {
      const mins = Math.max(1, Math.ceil((resetAt - Date.now()) / 60_000));
      message = `GitHub rate limit hit — resets in ~${mins} min`;
    } else {
      message = "GitHub rate limit hit. Try again shortly.";
    }
    throw new ApiError(message, res.status, resetAt);
  }
  if (res.status === 404) {
    throw new ApiError("User not found", 404, null);
  }
  throw new ApiError(message, res.status, null);
}
