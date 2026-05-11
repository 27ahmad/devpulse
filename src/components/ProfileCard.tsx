import type { GitHubUser } from "@/hooks/useGitHubUser";

export function ProfileCard({ user }: { user: GitHubUser }) {
  const joinYear = new Date(user.created_at).getFullYear();

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-[#30363d] bg-[#161b22] p-6 sm:flex-row sm:items-start sm:gap-6">
      <img
        src={user.avatar_url}
        alt={user.login}
        className="h-28 w-28 rounded-full border-2 border-[#30363d]"
      />
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {user.name ?? user.login}
          </h2>
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#58a6ff] hover:underline"
          >
            @{user.login}
          </a>
        </div>
        {user.bio && <p className="text-sm text-[#7d8590]">{user.bio}</p>}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-[#7d8590] sm:justify-start">
          {user.location && (
            <span>
              <span className="mr-1">📍</span>
              {user.location}
            </span>
          )}
          <span>Joined {joinYear}</span>
        </div>
        <div className="flex gap-4 text-sm">
          <span>
            <strong className="text-white">{user.public_repos}</strong>{" "}
            <span className="text-[#7d8590]">repos</span>
          </span>
          <span>
            <strong className="text-white">{user.followers}</strong>{" "}
            <span className="text-[#7d8590]">followers</span>
          </span>
          <span>
            <strong className="text-white">{user.following}</strong>{" "}
            <span className="text-[#7d8590]">following</span>
          </span>
        </div>
      </div>
    </div>
  );
}
