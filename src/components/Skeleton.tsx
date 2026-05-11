export function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-4 rounded-xl border border-[#30363d] bg-[#161b22] p-6 sm:flex-row sm:items-start sm:gap-6">
      <div className="h-28 w-28 rounded-full bg-[#30363d]" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-6 w-40 rounded bg-[#30363d]" />
        <div className="h-4 w-24 rounded bg-[#30363d]" />
        <div className="h-4 w-64 rounded bg-[#30363d]" />
        <div className="flex gap-4">
          <div className="h-4 w-16 rounded bg-[#30363d]" />
          <div className="h-4 w-16 rounded bg-[#30363d]" />
          <div className="h-4 w-16 rounded bg-[#30363d]" />
        </div>
      </div>
    </div>
  );
}

export function ReposSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-[#30363d] bg-[#161b22] p-4"
        >
          <div className="mb-2 h-5 w-32 rounded bg-[#30363d]" />
          <div className="mb-3 h-4 w-full rounded bg-[#30363d]" />
          <div className="flex gap-3">
            <div className="h-3 w-16 rounded bg-[#30363d]" />
            <div className="h-3 w-8 rounded bg-[#30363d]" />
          </div>
        </div>
      ))}
    </div>
  );
}
