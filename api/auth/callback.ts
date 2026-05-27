import type { VercelRequest, VercelResponse } from "@vercel/node";

function getOrigin(req: VercelRequest): string {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  if (!host) return "https://devpulse-lilac.vercel.app";
  // Force http protocol for local environments
  const protocol = (typeof host === "string" && host.includes("localhost")) ? "http" : proto;
  return `${protocol}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Error: Missing authorization code.");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).send("Server misconfigured: Missing client credentials.");
  }

  try {
    // 1. Exchange temporary authorization code for a permanent access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return res.status(502).send("Failed to exchange code for access token from GitHub.");
    }

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      return res.status(400).send("No access token returned from GitHub. Check your credentials.");
    }

    // 2. Query GitHub to get the logged-in user's profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "DevPulse",
        Accept: "application/vnd.github+json",
      },
    });

    let username = "";
    if (userRes.ok) {
      const userData = await userRes.json();
      username = userData.login;
    }

    // 3. Securely redirect back to the client-side SPA with credentials in the URL hash
    const origin = getOrigin(req);
    const redirectUrl = `${origin}/#token=${encodeURIComponent(token)}${username ? `&username=${encodeURIComponent(username)}` : ""}`;
    
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.redirect(redirectUrl);
  } catch {
    return res.status(500).send("Authentication callback failed due to an internal server error.");
  }
}
