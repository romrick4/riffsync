export default function AlbumDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="size-9 animate-pulse rounded-md bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="size-48 animate-pulse rounded-lg bg-muted" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-xs animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-sm animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <div className="h-4 w-6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
