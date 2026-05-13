export default function CalendarLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 h-8 w-28 animate-pulse rounded bg-muted" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`header-${i}`}
              className="h-8 animate-pulse bg-card"
            />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={`cell-${i}`}
              className="h-20 animate-pulse bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
