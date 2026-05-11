import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Download,
  Check,
  Play,
} from "lucide-react";
import { useGitHubUser } from "./hooks/useGitHubUser";
import { useGitHubRepos } from "./hooks/useGitHubRepos";
import { useContributions } from "./hooks/useContributions";
import { useLanguageMastery } from "./hooks/useLanguageMastery";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { CodingPatterns } from "./components/CodingPatterns";
import { TopProjects } from "./components/TopProjects";
import { StreakCounter } from "./components/StreakCounter";
import { InsightsPanel } from "./components/InsightsPanel";
import { computeInsights } from "./utils/insights";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProfileSkeleton, AnalyticsSkeleton } from "./components/Skeleton";
import { StoryPlayer } from "./story/StoryPlayer";
import { ApiError } from "./utils/fetchApi";
import type { GitHubUser } from "./hooks/useGitHubUser";
import type { Insights } from "./utils/insights";

const SkillConstellation = lazy(() =>
  import("./components/SkillConstellation").then((m) => ({
    default: m.SkillConstellation,
  }))
);

const USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

/* ─── Search Input ─── */
function SearchInput({
  onSubmit,
  size = "default",
}: {
  onSubmit: (username: string) => void;
  size?: "default" | "large";
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      if (!USERNAME_RE.test(trimmed)) {
        setError("That doesn't look like a GitHub username.");
        return;
      }
      setError(null);
      onSubmit(trimmed);
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
        onChange={(e) => {
          setInput(e.target.value);
          if (error) setError(null);
        }}
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
      {error && (
        <div className="absolute left-0 right-0 top-full mt-2 text-center text-[11px] text-[var(--red)]">
          {error}
        </div>
      )}
    </form>
  );
}

/* ─── Hero Landing ─── */
function HeroLanding({ onSearch }: { onSearch: (u: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
      className="flex flex-col items-center px-4 py-24 text-center sm:py-32"
    >
      <div className="mb-6 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">
        GitHub Wrapped, but cooler
      </div>

      <h1 className="mb-4 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-6xl">
        DevPulse
      </h1>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
        Drop a GitHub username. Get a 60-second cinematic year-in-code, then a
        deep-dive dashboard.
      </p>

      <div className="mb-16 w-full max-w-md">
        <SearchInput onSubmit={onSearch} size="large" />
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
        {[
          { label: "Story", desc: "12 cinematic scenes" },
          { label: "Insights", desc: "Real signals" },
          { label: "Heatmap", desc: "Full year data" },
          { label: "Shareable", desc: "Generated cards" },
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
    </motion.div>
  );
}

/* ─── Identity Banner ─── */
function IdentityBanner({
  user,
  insights,
}: {
  user: GitHubUser;
  insights: Insights | null;
}) {
  const joinYear = new Date(user.created_at).getFullYear();
  const yearsActive = new Date().getFullYear() - joinYear;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]"
    >
      <div className="relative p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-5">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
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
                  {user.public_repos.toLocaleString()}
                </strong>{" "}
                repos
              </span>
            </div>
          </div>
        </div>
      </div>

      {insights && <InsightsPanel insights={insights} />}
    </motion.div>
  );
}

/* ─── Share Bar (Deep Dive header) ─── */
function ShareBar({ username, onReplay }: { username: string; onReplay: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onReplay}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
      >
        <Play size={11} />
        Replay story
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "Copied" : "Share"}
      </button>
      <a
        href={`/api/og?user=${encodeURIComponent(username)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        <Download size={11} />
        Card
      </a>
    </div>
  );
}

/* ─── Dashboard: single scrollable page ─── */
function Dashboard({ username, onReplay }: { username: string; onReplay: () => void }) {
  const userQuery = useGitHubUser(username);
  const reposQuery = useGitHubRepos(username);
  const contribQuery = useContributions(username);
  const langQuery = useLanguageMastery(reposQuery.data);

  const insights =
    contribQuery.data && langQuery.data && userQuery.data
      ? computeInsights({
          user: userQuery.data,
          contributions: contribQuery.data,
          languages: langQuery.data,
        })
      : null;

  const isLoading =
    userQuery.isLoading || contribQuery.isLoading || langQuery.isLoading;

  const errorMessage =
    (userQuery.error as ApiError | undefined)?.message ??
    (contribQuery.error as ApiError | undefined)?.message ??
    null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <ShareBar username={username} onReplay={onReplay} />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-[var(--red)]/20 bg-[var(--red)]/5 p-4 text-center text-sm text-[var(--red)]">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <>
          <ProfileSkeleton />
          <AnalyticsSkeleton />
        </>
      )}

      {userQuery.data && (
        <ErrorBoundary>
          <IdentityBanner user={userQuery.data} insights={insights} />
        </ErrorBoundary>
      )}

      {langQuery.data && (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
                Loading constellation…
              </div>
            }
          >
            <SkillConstellation data={langQuery.data} />
          </Suspense>
        </ErrorBoundary>
      )}

      {contribQuery.data && insights && (
        <ErrorBoundary>
          <StreakCounter
            streak={{
              currentStreak: insights.currentStreak,
              longestStreak: insights.longestStreak,
            }}
          />
        </ErrorBoundary>
      )}

      {contribQuery.data && (
        <ErrorBoundary>
          <ActivityHeatmap data={contribQuery.data} />
        </ErrorBoundary>
      )}

      {contribQuery.data && (
        <ErrorBoundary>
          <CodingPatterns data={contribQuery.data} />
        </ErrorBoundary>
      )}

      {reposQuery.data && (
        <ErrorBoundary>
          <TopProjects repos={reposQuery.data} />
        </ErrorBoundary>
      )}
    </div>
  );
}

/* ─── Story gate: fetches data, hands off to player ─── */
function StoryGate({ username, onExit }: { username: string; onExit: () => void }) {
  const userQuery = useGitHubUser(username);
  const reposQuery = useGitHubRepos(username);
  const contribQuery = useContributions(username);
  const langQuery = useLanguageMastery(reposQuery.data);

  const ready =
    userQuery.data && contribQuery.data && langQuery.data;

  const error =
    (userQuery.error as ApiError | undefined) ??
    (contribQuery.error as ApiError | undefined);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center">
        <div className="mb-4 text-2xl font-semibold text-white">
          {error.message}
        </div>
        <button
          onClick={onExit}
          className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white/90"
        >
          Back
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <motion.div
          className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="mt-6 text-sm uppercase tracking-[0.3em] text-white/50">
          Composing @{username}'s year
        </div>
      </div>
    );
  }

  return (
    <StoryPlayer
      user={userQuery.data!}
      contributions={contribQuery.data!}
      languages={langQuery.data!}
      onExit={onExit}
    />
  );
}

/* ─── App ─── */
function App() {
  const [username, setUsername] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("user") ?? "";
  });
  const [view, setView] = useState<"story" | "dashboard">(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "dashboard" ? "dashboard" : "story";
  });

  const updateUrl = useCallback((u: string, v: "story" | "dashboard") => {
    const url = new URL(window.location.href);
    if (u) url.searchParams.set("user", u);
    else url.searchParams.delete("user");
    if (v === "dashboard") url.searchParams.set("view", "dashboard");
    else url.searchParams.delete("view");
    window.history.pushState({}, "", url.toString());
  }, []);

  const handleSearch = useCallback(
    (newUsername: string) => {
      const trimmed = newUsername.trim();
      if (!USERNAME_RE.test(trimmed)) return;
      setUsername(trimmed);
      setView("story");
      updateUrl(trimmed, "story");
    },
    [updateUrl]
  );

  const handleExitStory = useCallback(() => {
    setView("dashboard");
    updateUrl(username, "dashboard");
  }, [username, updateUrl]);

  const handleReplay = useCallback(() => {
    setView("story");
    updateUrl(username, "story");
  }, [username, updateUrl]);

  const handleHome = useCallback(() => {
    setUsername("");
    setView("story");
    window.history.pushState({}, "", window.location.pathname);
  }, []);

  // Sync on back/forward
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      setUsername(params.get("user") ?? "");
      setView(params.get("view") === "dashboard" ? "dashboard" : "story");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="min-h-screen">
      {!username && (
        <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
          <HeroLanding onSearch={handleSearch} />
          <footer className="mt-16 pb-6 text-center text-[11px] text-[var(--text-muted)]/40">
            DevPulse &middot; Data from GitHub API
          </footer>
        </div>
      )}

      {username && view === "story" && (
        <StoryGate username={username} onExit={handleExitStory} />
      )}

      {username && view === "dashboard" && (
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
          <header className="mb-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleHome}
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

          <Dashboard username={username} onReplay={handleReplay} />

          <footer className="mt-16 pb-6 text-center text-[11px] text-[var(--text-muted)]/40">
            DevPulse &middot; Data from GitHub API
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
