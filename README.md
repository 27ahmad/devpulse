# DevPulse

GitHub Wrapped, but cooler. Drop a username, get a 60-second cinematic story of any developer's year, then a deep-dive dashboard. Generated share cards unfurl on Twitter and LinkedIn.

## How it works

- **Story mode** — 12 full-screen scenes, kinetic typography, palette derived from the user's primary language. Total contributions, heatmap reveal, streak, weekday cadence, best month, language constellation, collaboration split, and an archetype reveal as the climax.
- **Dashboard mode** — the analytical view with an `InsightsPanel` (archetype + four signals), 3D skill constellation, contribution heatmap, weekly cadence, monthly trend, top projects.
- **Share cards** — `/api/og?user=<name>` returns a 1200×630 PNG. Edge middleware rewrites OG meta tags on the root route per user, so links unfurl with the user's archetype.

## Insight definitions

| Signal | Definition |
|---|---|
| `specializationPct` | bytes of #1 language / total bytes |
| `languageDiversity` | Shannon entropy across languages with ≥ 1% share |
| `weekdayWeekendRatio` | sum(Mon–Fri) / sum(Sat–Sun) commits |
| `collabShare` | (PRs + reviews) / totalContributions |
| `velocity` | totalContributions / activeDays |
| `consistency` | weeks with any activity / total weeks (server-computed) |
| `archetype` | derived label: Specialist, Polyglot, Collaborator, Solo Builder, Maintainer, Sprinter, Marathoner, Weekend Hacker, Quiet Year |

All signals come from a single year of GitHub data (`contributionsCollection` covers ~365 days).

## Stack

- React 19 + TypeScript + Vite
- TailwindCSS 4
- React Query for client data fetching with edge-cached proxies
- Three.js + React Three Fiber (lazily chunked)
- Framer Motion for story choreography
- Vercel serverless (`api/graphql.ts`, `api/github.ts`), Vercel Edge (`api/og.tsx`, `middleware.ts`)

## Setup

```bash
npm install
cp .env.example .env  # add GITHUB_PAT for higher rate limits on REST + GraphQL
npm run dev
```

The `GITHUB_PAT` should be a fine-grained personal access token with no scopes — it just bypasses unauthenticated rate limits for public reads.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build (typecheck + bundle)
- `npm run lint` — ESLint
- `npm run preview` — preview the production build

## Deployment

Pushes to main deploy on Vercel. `api/*` and `middleware.ts` are wired automatically. `GITHUB_PAT` must be set in Vercel project env vars.
