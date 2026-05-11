function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--surface-2)] ${className}`}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex gap-6">
      <Block className="h-24 w-24 shrink-0 !rounded-full" />
      <div className="flex flex-1 flex-col gap-3">
        <Block className="h-5 w-40" />
        <Block className="h-4 w-24" />
        <Block className="h-4 w-72" />
        <div className="flex gap-4">
          <Block className="h-3 w-16" />
          <Block className="h-3 w-16" />
          <Block className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Block className="h-24" />
        <Block className="h-24" />
      </div>
      <Block className="h-64" />
      <Block className="h-40" />
      <Block className="h-36" />
      <Block className="h-48" />
    </div>
  );
}

export function ReposSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-4"
        >
          <Block className="mb-2 h-4 w-32" />
          <Block className="mb-3 h-3 w-full" />
          <div className="flex gap-3">
            <Block className="h-3 w-14" />
            <Block className="h-3 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
