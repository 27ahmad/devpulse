import { MapPin, Calendar, GitFork } from "lucide-react";
import type { GitHubUser } from "../hooks/useGitHubUser";

export function ProfileCard({ user }: { user: GitHubUser }) {
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <img
        src={user.avatar_url}
        alt={user.login}
        className="h-24 w-24 rounded-full ring-1 ring-[var(--border)]"
      />
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {user.name ?? user.login}
          </h2>
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
          >
            @{user.login}
          </a>
        </div>
        {user.bio && (
          <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            {user.bio}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} />
              {user.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            Joined {joinDate}
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork size={12} />
            {user.public_repos} repos
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <span>
            <strong className="font-medium text-[var(--text)]">
              {user.followers.toLocaleString()}
            </strong>{" "}
            <span className="text-[var(--text-muted)]">followers</span>
          </span>
          <span>
            <strong className="font-medium text-[var(--text)]">
              {user.following.toLocaleString()}
            </strong>{" "}
            <span className="text-[var(--text-muted)]">following</span>
          </span>
        </div>
      </div>
    </div>
  );
}
