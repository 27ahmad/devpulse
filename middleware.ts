import { next } from "@vercel/edge";

export const config = {
  matcher: "/",
};

const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function middleware(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("user");

  if (!username || !USERNAME_RE.test(username)) {
    return next();
  }

  let html: string;
  try {
    // Static file lookups bypass the SPA rewrite in vercel.json.
    const response = await fetch(new URL("/index.html", url.origin).toString(), {
      headers: { "x-devpulse-mw": "1" },
    });
    if (!response.ok) return next();
    html = await response.text();
  } catch {
    return next();
  }

  const safeUser = escapeHtml(username);
  const ogImage = `${url.origin}/api/og?user=${encodeURIComponent(username)}`;
  const title = `@${safeUser} on DevPulse — Year in code`;
  const description = `See @${safeUser}'s year on GitHub, told in 60 seconds.`;

  const replacements: Array<[RegExp, string]> = [
    [/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`],
    [/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${description}" />`],
    [/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${ogImage}" />`],
    [/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`],
    [/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${description}" />`],
    [/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${ogImage}" />`],
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`],
  ];

  for (const [re, sub] of replacements) {
    html = html.replace(re, sub);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
