import { useState, useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Search,
  ArrowRight,
  GitCommit,
  GitPullRequest,
  Eye,
  FolderGit2,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useGitHubUser } from "./hooks/useGitHubUser";
import { useGitHubRepos } from "./hooks/useGitHubRepos";
import { useContributions } from "./hooks/useContributions";
import { useLanguageMastery } from "./hooks/useLanguageMastery";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { CodingPatterns } from "./components/CodingPatterns";
import { TopProjects } from "./components/TopProjects";
import { SkillConstellation } from "./components/SkillConstellation";
import { StreakCounter } from "./components/StreakCounter";
import { computeStreaks } from "./utils/streaks";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  ProfileSkeleton,
  AnalyticsSkeleton,
} from "./components/Skeleton";
import { computeRPGStats, type RPGStats } from "./utils/gamify";
import type { GitHubUser } from "./hooks/useGitHubUser";

/* ─── Search Input ─── */
function SearchInput({
  onSubmit,
  size = "default",
}: {
  onSubmit: (username: string) => void;
  size?: "default" | "large";
}) {
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed) onSubmit(trimmed);
    },
    [input, onSubmit]
  );

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        size={isLarge ? 18 : 14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search a GitHub username..."
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] ${isLarge ? "py-3.5 pl-11 pr-28 text-sm" : "py-2 pl-9 pr-20 text-xs"}`}
      />
      <button
        type="submit"
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-md bg-[var(--text)] font-medium text-[var(--bg)] transition-opacity hover:opacity-90 ${isLarge ? "px-4 py-2 text-xs" : "px-3 py-1.5 text-[11px]"}`}
      >
        Search
        <ArrowRight size={12} />
      </button>
    </form>
  );
}

/* ─── Hero Landing ─── */
function HeroLanding({ onSearch }: { onSearch: (u: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll("[data-animate]");
    gsap.fromTo(
      els,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center px-4 py-24 text-center sm:py-32"
    >
      <div
        data-animate
        className="mb-6 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]"
      >
        Developer intelligence, zero login required
      </div>

      <h1
        data-animate
        className="mb-4 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl"
      >
        DevPulse
      </h1>
      <p
        data-animate
        className="mb-10 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-base"
      >
        Language mastery, contribution patterns, and your developer character
        sheet — from any public GitHub profile.
      </p>

      <div data-animate className="mb-16 w-full max-w-md">
        <SearchInput onSubmit={onSearch} size="large" />
      </div>

      <div
        data-animate
        className="grid w-full max-w-lg grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4"
      >
        {[
          { label: "Languages", desc: "3D constellation" },
          { label: "Patterns", desc: "Weekly & monthly" },
          { label: "Heatmap", desc: "Full year data" },
          { label: "RPG Stats", desc: "Character sheet" },
        ].map((f) => (
          <div key={f.label} className="bg-[var(--surface)] p-4 text-center">
            <div className="text-xs font-medium text-[var(--text)]">
              {f.label}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── XP Bar ─── */
function XPBar({ value, max }: { value: number; max: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!barRef.current) return;
    const pct = Math.min((value / max) * 100, 100);
    gsap.fromTo(
      barRef.current,
      { width: "0%" },
      { width: `${pct}%`, duration: 1.2, ease: "power2.out", delay: 0.3 }
    );
  }, [value, max]);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a2e]">
      <div
        ref={barRef}
        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--purple)]"
      />
    </div>
  );
}

/* ─── Identity Banner: user info + RPG stats merged ─── */
function IdentityBanner({
  user,
  rpgStats,
}: {
  user: GitHubUser;
  rpgStats: RPGStats | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  const joinYear = new Date(user.created_at).getFullYear();
  const yearsActive = new Date().getFullYear() - joinYear;

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl border border-[var(--purple)]/15 bg-[var(--surface)]"
    >
      {/* Gradient accents */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--purple)]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-[var(--accent)]/5 blur-3xl" />

      <div className="relative p-6">
        {/* Top row: avatar + identity + class badge */}
        <div className="flex items-start gap-5">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="h-16 w-16 rounded-xl ring-1 ring-white/10"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  {user.name ?? user.login}
                </h2>
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
                >
                  @{user.login}
                  <ExternalLink size={10} />
                </a>
              </div>
              {rpgStats && (
                <span className="rounded border border-[var(--purple)]/20 bg-[var(--purple)]/5 px-2.5 py-1 text-xs font-medium text-[var(--purple)]">
                  {rpgStats.title}
                </span>
              )}
            </div>

            {/* RPG class + XP */}
            {rpgStats && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-lg">{rpgStats.classEmoji}</span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      Level {rpgStats.level}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {rpgStats.className}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-24">
                      <XPBar value={rpgStats.xp} max={rpgStats.xpToNext} />
                    </div>
                    <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                      {rpgStats.xp.toLocaleString()} /{" "}
                      {rpgStats.xpToNext.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
          {user.bio && (
            <span className="basis-full text-[var(--text-secondary)]">
              {user.bio}
            </span>
          )}
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={11} />
              {user.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={11} />
            {yearsActive}y on GitHub
          </span>
          <span>
            <strong className="font-medium text-[var(--text)]">
              {user.followers.toLocaleString()}
            </strong>{" "}
            followers
          </span>
          <span>
            <strong className="font-medium text-[var(--text)]">
              {user.following.toLocaleString()}
            </strong>{" "}
            following
          </span>
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-[var(--border-subtle)]" />

        {/* Stats grid */}
        {rpgStats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              {
                icon: <GitCommit size={13} />,
                value: rpgStats.commits,
                label: "Commits",
              },
              {
                icon: <GitPullRequest size={13} />,
                value: rpgStats.prs,
                label: "Pull requests",
              },
              {
                icon: <Eye size={13} />,
                value: rpgStats.reviews,
                label: "Reviews",
              },
              {
                icon: <FolderGit2 size={13} />,
                value: rpgStats.repoCount,
                label: "Repositories",
              },
              {
                icon: null,
                value: rpgStats.consistency,
                label: "Consistency",
                suffix: "%",
                highlight: true,
              },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                {stat.icon && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-[var(--text-muted)]">
                    {stat.icon}
                  </div>
                )}
                {!stat.icon && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--green)]/10">
                    <div className="h-2 w-2 rounded-full bg-[var(--green)]" />
                  </div>
                )}
                <div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${stat.highlight ? "text-[var(--green)]" : "text-[var(--text)]"}`}
                  >
                    {stat.value.toLocaleString()}
                    {stat.suffix ?? ""}
                  </span>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dashboard: single scrollable page ─── */
function Dashboard({ username }: { username: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  const userQuery = useGitHubUser(username);
  const reposQuery = useGitHubRepos(username);
  const contribQuery = useContributions(username);
  const langQuery = useLanguageMastery(reposQuery.data);

  const rpgStats =
    contribQuery.data && langQuery.data && userQuery.data
      ? computeRPGStats({
          totalContributions: contribQuery.data.totalContributions,
          commits: contribQuery.data.commits,
          pullRequests: contribQuery.data.pullRequests,
          reviews: contribQuery.data.reviews,
          primaryLanguage: langQuery.data[0]?.language ?? null,
          consistency: contribQuery.data.consistency,
          repoCount: userQuery.data.public_repos,
        })
      : null;

  const isLoading =
    userQuery.isLoading || contribQuery.isLoading || langQuery.isLoading;

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }, [username]);

  return (
    <div ref={contentRef} className="flex flex-col gap-4">
      {/* Error */}
      {userQuery.error && (
        <div className="rounded-lg border border-[var(--red)]/20 bg-[var(--red)]/5 p-4 text-center text-sm text-[var(--red)]">
          {userQuery.error.message}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <>
          <ProfileSkeleton />
          <AnalyticsSkeleton />
        </>
      )}

      {/* Identity Banner */}
      {userQuery.data && (
        <ErrorBoundary>
          <IdentityBanner user={userQuery.data} rpgStats={rpgStats} />
        </ErrorBoundary>
      )}

      {/* Skill Constellation */}
      {langQuery.data && (
        <ErrorBoundary>
          <SkillConstellation data={langQuery.data} />
        </ErrorBoundary>
      )}

      {/* Streaks */}
      {contribQuery.data && (
        <ErrorBoundary>
          <StreakCounter
            streak={computeStreaks(
              contribQuery.data.dailyContributions,
              new Date().getTimezoneOffset()
            )}
          />
        </ErrorBoundary>
      )}

      {/* Contribution Heatmap */}
      {contribQuery.data && (
        <ErrorBoundary>
          <ActivityHeatmap data={contribQuery.data} />
        </ErrorBoundary>
      )}

      {/* Coding Patterns */}
      {contribQuery.data && (
        <ErrorBoundary>
          <CodingPatterns data={contribQuery.data} />
        </ErrorBoundary>
      )}

      {/* Top Projects */}
      {reposQuery.data && (
        <ErrorBoundary>
          <TopProjects repos={reposQuery.data} />
        </ErrorBoundary>
      )}
    </div>
  );
}

/* ─── App ─── */
function App() {
  const [username, setUsername] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("user") ?? "";
  });

  const handleSearch = useCallback((newUsername: string) => {
    setUsername(newUsername);
    const url = new URL(window.location.href);
    url.searchParams.set("user", newUsername);
    window.history.pushState({}, "", url.toString());
  }, []);

  return (
    <div className="min-h-screen">
      {!username && (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <HeroLanding onSearch={handleSearch} />
          <footer className="mt-16 pb-6 text-center text-[11px] text-[var(--text-muted)]/40">
            DevPulse &middot; Data from GitHub API
          </footer>
        </div>
      )}

      {username && (
        <div className="mx-auto max-w-6xl px-6 py-6">
          <header className="mb-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setUsername("");
                  window.history.pushState({}, "", window.location.pathname);
                }}
                className="text-sm font-semibold text-[var(--text)] transition-opacity hover:opacity-70"
              >
                DevPulse
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                @{username}
              </span>
            </div>
            <SearchInput onSubmit={handleSearch} />
          </header>

          <Dashboard username={username} />

          <footer className="mt-16 pb-6 text-center text-[11px] text-[var(--text-muted)]/40">
            DevPulse &middot; Data from GitHub API
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
