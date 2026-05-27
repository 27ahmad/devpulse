import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Play,
  Lock,
} from "lucide-react";
import { useGitHubUser } from "./hooks/useGitHubUser";
import { useGitHubRepos } from "./hooks/useGitHubRepos";
import { useContributions } from "./hooks/useContributions";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { CodingPatterns } from "./components/CodingPatterns";
import { TopProjects } from "./components/TopProjects";
import { StreakCounter } from "./components/StreakCounter";
import { InsightsPanel } from "./components/InsightsPanel";
import { computeInsights } from "./utils/insights";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProfileSkeleton, AnalyticsSkeleton } from "./components/Skeleton";
import { StoryPlayer } from "./story/StoryPlayer";
import { placeholderPalette } from "./story/usePalette";
import { ApiError } from "./utils/fetchApi";
import type { GitHubUser } from "./hooks/useGitHubUser";
import type { Insights } from "./utils/insights";

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
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      />
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Search a GitHub username..."
        autoComplete="off"
        spellCheck={false}
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
const SUGGESTED_USERS = ["torvalds", "gaearon", "sindresorhus", "tj"];
const HERO_BEAM = [
  { color: "#3178c6", pct: 38 }, // TypeScript
  { color: "#f1e05a", pct: 22 }, // JavaScript
  { color: "#3572A5", pct: 14 }, // Python
  { color: "#00ADD8", pct: 10 }, // Go
  { color: "#dea584", pct: 8 },  // Rust
  { color: "#52525b", pct: 8 },  // Other
];

function HeroBeam() {
  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)]/70">
        <span>Year in code</span>
        <span>preview</span>
      </div>
      <div className="flex h-12 w-full overflow-hidden rounded-lg ring-1 ring-white/5">
        {HERO_BEAM.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${seg.pct}%` }}
            transition={{ delay: 0.9 + i * 0.07, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              background: `linear-gradient(180deg, ${seg.color}, ${seg.color}b3)`,
              boxShadow:
                i === 0
                  ? `inset 0 0 30px ${seg.color}66`
                  : `inset 0 0 18px ${seg.color}44`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[var(--text-muted)] sm:grid-cols-6">
        {["TypeScript", "JavaScript", "Python", "Go", "Rust", "Other"].map((l, i) => (
          <div key={l} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: HERO_BEAM[i].color }}
            />
            <span className="truncate">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6 }}
        className="absolute left-1/2 top-[-10%] h-[600px] w-[1000px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, #6366f166, transparent 65%)" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="absolute -left-40 top-[18%] h-[420px] w-[420px] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, #ec489955, transparent 70%)" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.35 }}
        className="absolute -right-40 top-[25%] h-[480px] w-[480px] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, #a78bfa55, transparent 70%)" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.55 }}
        className="absolute bottom-[5%] left-1/2 h-[400px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, #22d3ee44, transparent 70%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at center, black 30%, transparent 80%)",
        }}
      />
    </div>
  );
}

function HeroEyebrow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="mb-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.45em] text-[var(--text-muted)]"
    >
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--text-muted)]/40" />
      <span className="font-medium text-[var(--text-secondary)]">
        Your year in code, in 60 seconds
      </span>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--text-muted)]/40" />
    </motion.div>
  );
}

function HeroLanding({
  onSearch,
  currentUser,
  onLogin,
  onLogout,
}: {
  onSearch: (u: string) => void;
  currentUser: { token: string; username: string } | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="relative">
      <HeroBackdrop />

      {/* Floating Header */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-3 sm:right-8 sm:top-8">
        {currentUser ? (
          <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-1.5 backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--green)]" />
              @{currentUser.username}
            </span>
            <button
              onClick={onLogout}
              className="text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-1.5 text-xs font-medium text-[var(--text)] backdrop-blur-md transition-colors hover:bg-[var(--surface-2)]"
          >
            Sign in with GitHub
          </button>
        )}
      </div>

      {/* Top section: chip → wordmark → search → chips → disclaimer */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center px-4 pt-16 text-center sm:pt-24"
      >
        <HeroEyebrow />

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mb-6 bg-gradient-to-br from-white via-white to-white/30 bg-clip-text text-7xl font-semibold tracking-tighter text-transparent sm:text-[7rem] md:text-[9rem]"
        >
          DevPulse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
        >
          Drop a GitHub username. Watch a cinematic year-in-code in 60 seconds,
          then dive into the dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <SearchInput onSubmit={onSearch} size="large" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-1.5"
        >
          <span className="mr-1 text-[11px] text-[var(--text-muted)]/60">
            Try
          </span>
          {SUGGESTED_USERS.map((u) => (
            <button
              key={u}
              onClick={() => onSearch(u)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-2.5 py-1 text-[11px] text-[var(--text-secondary)] backdrop-blur transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              {u}
            </button>
          ))}
        </motion.div>

        {/* Premium Connection Promo Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="mt-8 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 p-5 backdrop-blur-md"
        >
          {currentUser ? (
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--green)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--green)]"></span>
                </span>
                GitHub Connected
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Logged in as **@{currentUser.username}**. Private commits and repository statistics are fully active.
              </p>
              <button
                onClick={() => onSearch(currentUser.username)}
                className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-[var(--text)] px-4.5 py-2 text-xs font-semibold text-[var(--bg)] transition-opacity hover:opacity-90"
              >
                Reveal My Story
                <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--purple)]">
                Unlocks Private Analytics
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Connect your account to include **private commits**, PR metrics, and language distributions in your charts & story.
              </p>
              <button
                onClick={onLogin}
                className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/80 px-4 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:border-[var(--text-secondary)]"
              >
                <svg className="h-4 w-4 fill-[var(--text)]" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Connect with GitHub
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]/60"
        >
          <Lock size={10} />
          {currentUser ? "Private & public data integrated." : "Public GitHub data by default."}
        </motion.div>
      </motion.section>

      {/* Preview strip — tightened against the hero so the page reads as one
          composition instead of two stacked sections separated by dead space */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="relative mx-auto mt-12 w-full max-w-3xl px-4 pb-16"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/30 p-6 backdrop-blur-md sm:p-8">
          <HeroBeam />
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--border-subtle)] pt-5">
            {[
              ["12+", "personalized scenes"],
              ["Archetype", "reveal"],
              ["Share", "card"],
            ].map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="text-base font-semibold text-[var(--text)]">
                  {k}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}

/* ─── Identity Banner ─── */
function formatRecency(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return "Active today";
  if (days === 1) return "Active yesterday";
  if (days < 7) return `Active ${days} days ago`;
  if (days < 30) return `Active ${Math.floor(days / 7)}w ago`;
  if (days < 365) return `Active ${Math.floor(days / 30)}mo ago`;
  return "Inactive over 1y";
}

function IdentityBanner({
  user,
  insights,
}: {
  user: GitHubUser;
  insights: Insights | null;
}) {
  const joinYear = new Date(user.created_at).getFullYear();
  const yearsActive = new Date().getFullYear() - joinYear;
  const recency = insights ? formatRecency(insights.daysSinceLastActive) : null;
  const recencyDot =
    insights && insights.daysSinceLastActive !== null
      ? insights.daysSinceLastActive <= 7
        ? "#22c55e"
        : insights.daysSinceLastActive <= 30
          ? "#eab308"
          : "#71717a"
      : null;

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
            <h2 className="text-lg font-semibold text-[var(--text)] sm:text-xl">
              {user.name ?? user.login}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                @{user.login}
                <ExternalLink size={10} />
              </a>
              {recency && recencyDot && (
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: recencyDot }}
                  />
                  {recency}
                </span>
              )}
            </div>
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
              {insights && insights.restrictedContributions > 0 && (
                <span className="flex items-center gap-1 text-[var(--text-muted)]/80">
                  <Lock size={10} />+
                  {insights.restrictedContributions.toLocaleString()} private
                  shown
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {insights && <InsightsPanel insights={insights} />}
    </motion.div>
  );
}

/* ─── Share Bar ─── */
function ShareBar({ onReplay }: { onReplay: () => void }) {
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
        {copied ? "Copied" : "Share link"}
      </button>
    </div>
  );
}

/* ─── Dashboard ─── */
function Dashboard({ username, onReplay }: { username: string; onReplay: () => void }) {
  const userQuery = useGitHubUser(username);
  const reposQuery = useGitHubRepos(username);
  const contribQuery = useContributions(username);

  const insights =
    contribQuery.data && userQuery.data
      ? computeInsights({
          user: userQuery.data,
          contributions: contribQuery.data,
        })
      : null;

  const isLoading = userQuery.isLoading || contribQuery.isLoading;

  const errorMessage =
    (userQuery.error as ApiError | undefined)?.message ??
    (contribQuery.error as ApiError | undefined)?.message ??
    null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <ShareBar onReplay={onReplay} />
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

/* ─── Story gate ─── */
function StoryGate({ username, onExit }: { username: string; onExit: () => void }) {
  const userQuery = useGitHubUser(username);
  const contribQuery = useContributions(username);

  const ready = userQuery.data && contribQuery.data;

  const error =
    (userQuery.error as ApiError | undefined) ??
    (contribQuery.error as ApiError | undefined);

  const placeholder = placeholderPalette(username);

  if (error) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: placeholder.gradient }}
      >
        <div className="mb-2 text-xs uppercase tracking-[0.3em] text-white/40">
          @{username}
        </div>
        <div className="mb-6 max-w-md text-2xl font-semibold text-white">
          {error.message}
        </div>
        <button
          onClick={onExit}
          className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10"
        >
          Back
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: placeholder.gradient }}
      >
        <motion.div
          className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="mt-6 text-sm uppercase tracking-[0.3em] text-white/60">
          Composing @{username}'s year
        </div>
      </div>
    );
  }

  return (
    <StoryPlayer
      user={userQuery.data!}
      contributions={contribQuery.data!}
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

  const [currentUser, setCurrentUser] = useState<{ token: string; username: string } | null>(() => {
    const token = localStorage.getItem("devpulse_github_token");
    const username = localStorage.getItem("devpulse_github_username");
    return token && username ? { token, username } : null;
  });

  const updateUrl = useCallback((u: string, v: "story" | "dashboard") => {
    const url = new URL(window.location.href);
    if (u) url.searchParams.set("user", u);
    else url.searchParams.delete("user");
    if (v === "dashboard") url.searchParams.set("view", "dashboard");
    else url.searchParams.delete("view");
    window.history.pushState({}, "", url.toString());
  }, []);

  // Capture token & username from URL hash on redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("token=")) {
      const params = new URLSearchParams(hash.substring(1)); // Strip '#'
      const token = params.get("token");
      const user = params.get("username");
      if (token && user) {
        localStorage.setItem("devpulse_github_token", token);
        localStorage.setItem("devpulse_github_username", user);
        setCurrentUser({ token, username: user });

        // Clean up hash from browser address bar
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );

        // If no user query parameter is active, default to showing the logged-in user
        const searchParams = new URLSearchParams(window.location.search);
        if (!searchParams.get("user")) {
          setUsername(user);
          setView("story");
          updateUrl(user, "story");
        }
      }
    }
  }, [updateUrl]);

  const handleLogin = useCallback(() => {
    window.location.href = "/api/auth/login";
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("devpulse_github_token");
    localStorage.removeItem("devpulse_github_username");
    setCurrentUser(null);
    setUsername("");
    setView("story");
    window.history.pushState({}, "", window.location.pathname);
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
        <>
          <HeroLanding
            onSearch={handleSearch}
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
          <footer className="pb-6 text-center text-[11px] text-[var(--text-muted)]/50">
            DevPulse · Public GitHub data
          </footer>
        </>
      )}

      {username && view === "story" && (
        <StoryGate username={username} onExit={handleExitStory} />
      )}

      {username && view === "dashboard" && (
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
          <header className="mb-6 flex flex-col gap-4 sm:mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={handleHome}
                className="text-sm font-semibold text-[var(--text)] transition-opacity hover:opacity-70"
              >
                DevPulse
              </button>
              <div className="flex items-center gap-3">
                {currentUser && currentUser.username.toLowerCase() === username.toLowerCase() && (
                  <span className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                    <Lock size={9} />
                    Private Active
                  </span>
                )}
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">
                      @{currentUser.username}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)]"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>
            <SearchInput onSubmit={handleSearch} />
          </header>

          <Dashboard username={username} onReplay={handleReplay} />

          <footer className="mt-16 pb-6 text-center text-[11px] text-[var(--text-muted)]/50">
            {currentUser && currentUser.username.toLowerCase() === username.toLowerCase() ? (
              <span className="text-[var(--green)] font-medium">
                DevPulse · Private and public repository statistics are fully integrated
              </span>
            ) : (
              <span>
                DevPulse · Public GitHub data only · Private contributions aren't included
              </span>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
