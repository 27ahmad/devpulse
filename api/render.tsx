import type { VercelRequest, VercelResponse } from "@vercel/node";

const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inferOrigin(req: VercelRequest): string {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  if (!host) return "";
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const usernameParam = req.query.user;
  const username =
    typeof usernameParam === "string" ? usernameParam : null;
  const origin = inferOrigin(req);

  if (!origin) {
    res.status(500).send("Could not infer deployment origin");
    return;
  }

  let html: string;
  try {
    const response = await fetch(`${origin}/index.html`, {
      headers: { "x-devpulse-render": "1" },
    });
    if (!response.ok) {
      res.status(502).send("Failed to fetch index.html");
      return;
    }
    html = await response.text();
  } catch {
    res.status(502).send("Failed to fetch index.html");
    return;
  }

  // If the username is missing/invalid, return the template as-is.
  if (!username || !USERNAME_RE.test(username)) {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=60, stale-while-revalidate=600");
    res.status(200).send(html);
    return;
  }

  const safeUser = escapeHtml(username);
  const ogImage = `${origin}/api/og?user=${encodeURIComponent(username)}`;
  const title = `@${safeUser} on DevPulse — Year in code`;
  const description = `See @${safeUser}'s year on GitHub, told in 60 seconds.`;

  const replacements: Array<[RegExp, string]> = [
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`],
    [/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`],
    [/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${description}" />`],
    [/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${ogImage}" />`],
    [/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`],
    [/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${description}" />`],
    [/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${ogImage}" />`],
  ];

  for (const [re, sub] of replacements) {
    html = html.replace(re, sub);
  }

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
}
