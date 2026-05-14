"use client";

import { DemoVersionTree } from "./demo-version-tree";

const CHAT_BUBBLES = [
  { text: "wait which version are we learning", fromMe: false, delay: 0 },
  { text: "the one Alex sent Tuesday", fromMe: true, delay: 0.4 },
  { text: "I sent two on Tuesday", fromMe: false, delay: 1.0 },
  { text: "…the good one", fromMe: true, delay: 1.6 },
  { text: "they were both good?", fromMe: false, delay: 2.4 },
  { text: "nvm I'll just re-record it 😤", fromMe: true, delay: 3.2 },
];

export function ChaosVsClarity() {
  return (
    <section className="border-t border-border/50 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-0">
          {/* Chaos side */}
          <div className="relative overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6 sm:p-8 lg:rounded-r-none lg:border-r-0">
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              This is how your band works now
            </p>

            <div className="relative min-h-[280px]">
              {/* Chat bubbles */}
              <div className="flex flex-col gap-2">
                {CHAT_BUBBLES.map((bubble, i) => (
                  <div
                    key={i}
                    className={`chaos-bubble flex ${
                      bubble.fromMe ? "justify-end" : "justify-start"
                    }`}
                    style={{
                      animationDelay: `${bubble.delay}s`,
                    }}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        bubble.fromMe
                          ? "rounded-br-md bg-blue-600/90 text-white"
                          : "rounded-bl-md bg-muted/80 text-foreground/90"
                      }`}
                    >
                      {bubble.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating chaos elements */}
              <div className="pointer-events-none absolute -right-2 top-2 chaos-float-1">
                <div className="rounded-lg border border-border/30 bg-card/40 px-2.5 py-1.5 text-[10px] text-muted-foreground/50 backdrop-blur-sm">
                  <span className="font-mono">final_mix_v3_REAL_USE_THIS(2).mp3</span>
                </div>
              </div>

              <div className="pointer-events-none absolute -left-1 bottom-8 chaos-float-2">
                <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-card/40 px-2.5 py-1 text-[10px] text-muted-foreground/50 backdrop-blur-sm">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-destructive/80" />
                  </span>
                  47 unread
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-0 right-4 chaos-float-3">
                <div className="rounded-lg border border-border/30 bg-card/40 px-2.5 py-1.5 text-[10px] text-muted-foreground/50 backdrop-blur-sm">
                  🗓️ Practice Sat? Sun? idk
                </div>
              </div>
            </div>
          </div>

          {/* Clarity side */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.02] p-6 sm:p-8 lg:rounded-l-none lg:border-l-0">
            <p className="mb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
              This is how it could work
            </p>

            <div className="flex min-h-[280px] items-center justify-center">
              <DemoVersionTree />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
