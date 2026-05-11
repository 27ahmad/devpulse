import { useQuery } from "@tanstack/react-query";

interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    ref?: string;
    ref_type?: string;
    action?: string;
    pull_request?: {
      created_at: string;
      merged_at: string | null;
    };
    commits?: { sha: string }[];
    size?: number;
  };
}

export interface EventSummary {
  dailyCommits: Record<string, number>;
  totalCommits: number;
  pushesToMain: number;
  prLeadTimes: number[];
  weeklyPushes: Record<string, number>;
}

function aggregateEvents(
  events: GitHubEvent[],
  timezoneOffset: number
): EventSummary {
  const dailyCommits: Record<string, number> = {};
  let totalCommits = 0;
  let pushesToMain = 0;
  const prLeadTimes: number[] = [];
  const weeklyPushes: Record<string, number> = {};

  for (const event of events) {
    const utcDate = new Date(event.created_at);
    const localDate = new Date(
      utcDate.getTime() - timezoneOffset * 60 * 1000
    );
    const dateStr = localDate.toISOString().slice(0, 10);

    if (event.type === "PushEvent") {
      const commitCount = event.payload.size ?? event.payload.commits?.length ?? 1;
      dailyCommits[dateStr] = (dailyCommits[dateStr] ?? 0) + commitCount;
      totalCommits += commitCount;

      const ref = event.payload.ref ?? "";
      if (ref.endsWith("/main") || ref.endsWith("/master")) {
        pushesToMain++;
        // Week key for DORA
        const weekStart = new Date(localDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);
        weeklyPushes[weekKey] = (weeklyPushes[weekKey] ?? 0) + 1;
      }
    }

    if (
      event.type === "PullRequestEvent" &&
      event.payload.action === "closed" &&
      event.payload.pull_request?.merged_at
    ) {
      const opened = new Date(event.payload.pull_request.created_at).getTime();
      const merged = new Date(event.payload.pull_request.merged_at).getTime();
      const leadTimeHours = (merged - opened) / (1000 * 60 * 60);
      if (leadTimeHours >= 0) {
        prLeadTimes.push(leadTimeHours);
      }
    }
  }

  return { dailyCommits, totalCommits, pushesToMain, prLeadTimes, weeklyPushes };
}

async function fetchAllEvents(username: string): Promise<GitHubEvent[]> {
  const allEvents: GitHubEvent[] = [];
  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(
      `/api/github?path=users/${encodeURIComponent(username)}/events&per_page=100&page=${page}`
    );
    if (!res.ok) break;
    const events: GitHubEvent[] = await res.json();
    if (!Array.isArray(events) || events.length === 0) break;
    allEvents.push(...events);
  }

  return allEvents;
}

export function useGitHubEvents(username: string) {
  const timezoneOffset = new Date().getTimezoneOffset();

  return useQuery({
    queryKey: ["github-events", username],
    queryFn: async () => {
      const events = await fetchAllEvents(username);
      return aggregateEvents(events, timezoneOffset);
    },
    enabled: username.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
