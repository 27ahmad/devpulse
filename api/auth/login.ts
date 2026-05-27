import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "Server misconfigured: GITHUB_CLIENT_ID is missing" });
  }

  // Request read:user for profile/avatar, and repo for private repos & contributions
  const scope = "read:user,repo";
  
  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    prompt: "consent",
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.redirect(githubAuthUrl);
}
