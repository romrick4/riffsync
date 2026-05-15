const WAVEFORM_BARS = (() => {
  const bars: number[] = [];
  for (let i = 0; i < 64; i++) {
    const x = i / 64;
    const h =
      0.25 +
      Math.abs(Math.sin(x * Math.PI * 2.3 + 1.7)) * 0.3 +
      Math.abs(Math.cos(x * Math.PI * 6.1 + 0.4)) * 0.2 +
      Math.abs(Math.sin(x * Math.PI * 12 + 2.1)) * 0.15;
    bars.push(Math.min(h, 0.95));
  }
  return bars;
})();

const COMMENTS = [
  { pct: 16, label: "Love this riff" },
  { pct: 38, label: "Drums feel rushed" },
  { pct: 81, label: "Softer ending?" },
];

const VERSIONS = [
  { name: "Added bass line", active: true, tag: "latest" },
  { name: "Guitar lead take 2", active: false },
  { name: "First rough mix", active: false },
];

export function AppMockup() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1e] shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="ml-3 text-xs text-white/30">
            Midnight Drive — Neon Reverie
          </span>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1fr_180px]">
          {/* Main content area */}
          <div className="p-5 sm:p-6">
            {/* Song header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white/90">
                  Midnight Drive
                </h3>
                <p className="mt-0.5 text-xs text-white/40">
                  Added bass line &middot; 3:18
                </p>
              </div>
              <div className="flex gap-1.5">
                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-white/40">
                  WAV
                </span>
                <span className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-medium text-primary/80">
                  3 comments
                </span>
              </div>
            </div>

            {/* Waveform */}
            <div className="relative mb-5">
              <div className="flex h-14 items-end gap-[3px]">
                {WAVEFORM_BARS.map((h, i) => {
                  const progress = 0.38;
                  const barPos = i / WAVEFORM_BARS.length;
                  return (
                    <div
                      key={i}
                      className={`min-w-[3px] flex-1 rounded-full ${
                        barPos <= progress
                          ? "bg-primary/70"
                          : "bg-white/[0.08]"
                      }`}
                      style={{ height: `${h * 100}%` }}
                    />
                  );
                })}
              </div>

              {/* Comment pins */}
              {COMMENTS.map((c, i) => (
                <div
                  key={i}
                  className="absolute -top-1 -translate-x-1/2"
                  style={{ left: `${c.pct}%` }}
                >
                  <div className="size-2 rounded-full bg-primary/80 ring-2 ring-primary/20" />
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 h-14 w-px bg-primary/60"
                style={{ left: "38%" }}
              />

              {/* Timestamp */}
              <div className="mt-2 flex justify-between text-[10px] text-white/25">
                <span>1:15</span>
                <span>3:18</span>
              </div>
            </div>

            {/* Inline comment preview */}
            <div className="space-y-1.5">
              {COMMENTS.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2"
                >
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary/70">
                    {i === 0 ? "0:32" : i === 1 ? "1:15" : "2:41"}
                  </span>
                  <span className="text-xs text-white/50">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Versions sidebar */}
          <div className="border-t border-white/[0.06] p-4 sm:border-l sm:border-t-0">
            <p className="mb-3 text-[10px] font-medium text-white/30">
              Versions
            </p>
            <div className="space-y-1.5">
              {VERSIONS.map((v, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-2.5 py-2 text-xs ${
                    v.active
                      ? "bg-primary/10 text-white/70 ring-1 ring-primary/20"
                      : "text-white/35"
                  }`}
                >
                  <span className="block leading-tight">{v.name}</span>
                  {v.tag && (
                    <span className="mt-1 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary/60">
                      {v.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
