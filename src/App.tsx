import { useState, useCallback } from "react";
import { useGitHubUser } from "@/hooks/useGitHubUser";
import { useGitHubRepos } from "@/hooks/useGitHubRepos";
import { ProfileCard } from "@/components/ProfileCard";
import { RepoList } from "@/components/RepoList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileSkeleton, ReposSkeleton } from "@/components/Skeleton";

type Tab = "profile" | "analytics";

function UsernameInput({
  onSubmit,
}: {
  onSubmit: (username: string) => void;
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

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a GitHub username..."
        className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none transition-colors focus:border-[#58a6ff]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#238636] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043]"
      >
        Search
      </button>
    </form>
  );
}

function Dashboard({ username }: { username: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const userQuery = useGitHubUser(username);
  const reposQuery = useGitHubRepos(username);

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-1 border-b border-[#30363d]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[#f78166] text-white"
                : "text-[#7d8590] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "profile" && (
        <div className="flex flex-col gap-6">
          <ErrorBoundary>
            {userQuery.isLoading && <ProfileSkeleton />}
            {userQuery.error && (
              <div className="rounded-lg border border-[#f8514966] bg-[#f8514915] p-4 text-center text-sm text-[#f85149]">
                {userQuery.error.message}
              </div>
            )}
            {userQuery.data && <ProfileCard user={userQuery.data} />}
          </ErrorBoundary>

          <ErrorBoundary>
            <div>
              <h3 className="mb-3 text-base font-semibold text-white">
                Repositories
              </h3>
              {reposQuery.isLoading && <ReposSkeleton />}
              {reposQuery.error && (
                <div className="rounded-lg border border-[#f8514966] bg-[#f8514915] p-4 text-center text-sm text-[#f85149]">
                  Failed to load repositories.
                </div>
              )}
              {reposQuery.data && <RepoList repos={reposQuery.data} />}
            </div>
          </ErrorBoundary>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-8 text-center text-[#7d8590]">
          Analytics coming in Phase 2.
        </div>
      )}
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
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">DevPulse</h1>
          <span className="rounded-full bg-[#238636] px-2 py-0.5 text-xs font-medium text-white">
            beta
          </span>
        </div>
        <UsernameInput onSubmit={handleSearch} />
      </header>

      {!username && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="text-4xl">&#128640;</div>
          <h2 className="text-xl font-semibold text-white">
            Developer Intelligence Dashboard
          </h2>
          <p className="max-w-md text-sm text-[#7d8590]">
            Enter a GitHub username to explore their coding profile, language
            mastery, contribution streaks, and velocity metrics.
          </p>
        </div>
      )}

      {username && <Dashboard username={username} />}
    </div>
  );
}

export default App;
