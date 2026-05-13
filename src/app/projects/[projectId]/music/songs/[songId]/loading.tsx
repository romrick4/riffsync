export default function SongDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="size-9 animate-pulse rounded-md bg-muted" />
        <div className="size-14 animate-pulse rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          {["w-24", "w-16", "w-14", "w-16"].map((w, i) => (
            <div
              key={i}
              className={`h-9 ${w} animate-pulse rounded-md bg-muted`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-3 h-12 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
