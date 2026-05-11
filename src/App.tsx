import { useState, useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { Search, ArrowRight, User, BarChart3 } from "lucide-react";
import { useGitHubUser } from "./hooks/useGitHubUser";
import { useGitHubRepos } from "./hooks/useGitHubRepos";
import { useContributions } from "./hooks/useContributions";
import { useLanguageMastery } from "./hooks/useLanguageMastery";
import { ProfileCard } from "./components/ProfileCard";
import { RepoList } from "./components/RepoList";
import { LanguageChart } from "./components/LanguageChart";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { CodingPatterns } from "./components/CodingPatterns";
import { OverviewStats } from "./components/OverviewStats";
import { TopProjects } from "./components/TopProjects";
import { RPGStatSheet } from "./components/RPGStatSheet";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DNAHelix } from "./components/DNAHelix";
import {
  ProfileSkeleton,
  ReposSkeleton,
  AnalyticsSkeleton,
} from "./components/Skeleton";
import { computeRPGStats } from "./utils/gamify";

type Tab = "profile" | "analytics";

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
          { label: "Languages", desc: "Proportional breakdown" },
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

function Dashboard({ username }: { username: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
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

  const analyticsLoading = contribQuery.isLoading || langQuery.isLoading;

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }, [activeTab]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <User size={14} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-px rounded-md border border-[var(--border)] bg-[var(--border)] p-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-medium transition-colors first:rounded-l-[5px] last:rounded-r-[5px] ${
              activeTab === tab.key
                ? "bg-[var(--surface-2)] text-[var(--text)]"
                : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div ref={contentRef} key={activeTab}>
        {activeTab === "profile" && (
          <div className="flex flex-col gap-6">
            <ErrorBoundary>
              {userQuery.isLoading && <ProfileSkeleton />}
              {userQuery.error && (
                <div className="rounded-lg border border-[var(--red)]/20 bg-[var(--red)]/5 p-4 text-center text-sm text-[var(--red)]">
                  {userQuery.error.message}
                </div>
              )}
              {userQuery.data && <ProfileCard user={userQuery.data} />}
            </ErrorBoundary>

            <ErrorBoundary>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text)]">
                    Repositories
                  </span>
                  {reposQuery.data && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {reposQuery.data.length} repos
                    </span>
                  )}
                </div>
                {reposQuery.isLoading && <ReposSkeleton />}
                {reposQuery.error && (
                  <div className="rounded-lg border border-[var(--red)]/20 bg-[var(--red)]/5 p-4 text-center text-sm text-[var(--red)]">
                    Failed to load repositories.
                  </div>
                )}
                {reposQuery.data && <RepoList repos={reposQuery.data} />}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="flex flex-col gap-3">
            {analyticsLoading && <AnalyticsSkeleton />}

            {(contribQuery.error || langQuery.error) && (
              <div className="rounded-lg border border-[var(--red)]/20 bg-[var(--red)]/5 p-4 text-center text-sm text-[var(--red)]">
                {contribQuery.error?.message ?? "Failed to load analytics data."}
              </div>
            )}

            {!analyticsLoading && (
              <>
                {/* All-time overview */}
                {userQuery.data && reposQuery.data && (
                  <ErrorBoundary>
                    <OverviewStats
                      user={userQuery.data}
                      repos={reposQuery.data}
                    />
                  </ErrorBoundary>
                )}

                {/* RPG card */}
                {rpgStats && (
                  <ErrorBoundary>
                    <RPGStatSheet stats={rpgStats} />
                  </ErrorBoundary>
                )}

                {/* Engineering DNA */}
                {contribQuery.data && (
                  <ErrorBoundary>
                    <DNAHelix data={contribQuery.data} />
                  </ErrorBoundary>
                )}

                {/* Past year activity */}
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

                {/* All-time data */}
                {reposQuery.data && (
                  <ErrorBoundary>
                    <TopProjects repos={reposQuery.data} />
                  </ErrorBoundary>
                )}
                {langQuery.data && (
                  <ErrorBoundary>
                    <LanguageChart data={langQuery.data} />
                  </ErrorBoundary>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
      <div className="mx-auto max-w-3xl px-4 py-6">
        {username && (
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
        )}

        {!username && <HeroLanding onSearch={handleSearch} />}
        {username && <Dashboard username={username} />}

        <footer className="mt-16 pb-6 text-center text-[11px] text-[var(--text-muted)]/40">
          DevPulse &middot; Data from GitHub API
        </footer>
      </div>
    </div>
  );
}

export default App;
