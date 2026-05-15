"use client";

import { DemoVersionTree } from "./demo-version-tree";
import { AppMockup } from "./app-mockup";

const CHAT_BUBBLES = [
  { text: "yo did anyone save that new riff Jake played at practice", fromMe: false, delay: 0 },
  { text: "I think he voice memo'd it", fromMe: true, delay: 0.5 },
  { text: "that was two weeks ago lol", fromMe: false, delay: 1.1 },
  { text: "check the drive", fromMe: true, delay: 1.7 },
  { text: "which folder", fromMe: false, delay: 2.2 },
  { text: "idk Maya renamed everything", fromMe: true, delay: 2.8 },
  { text: "I didn't rename anything??", fromMe: false, delay: 3.4 },
  { text: "ok it's gone lol", fromMe: true, delay: 4.0 },
];

export function ChaosSection() {
  return (
    <section className="bg-destructive/[0.04] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Sound familiar?
        </h2>
        <p className="mb-12 text-center text-base text-muted-foreground">
          Demos buried in group chats. Nobody knows which version is the
          latest. The chaos adds up.
        </p>

        <div className="mx-auto max-w-sm">
          <div className="flex flex-col gap-2">
            {CHAT_BUBBLES.map((bubble, i) => (
              <div
                key={i}
                className={`chaos-bubble flex ${
                  bubble.fromMe ? "justify-end" : "justify-start"
                }`}
                style={{ animationDelay: `${bubble.delay}s` }}
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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="chaos-float-1">
              <div className="rounded-lg border border-border/30 bg-card/40 px-2.5 py-1.5 text-[10px] text-muted-foreground/50 backdrop-blur-sm">
                <span className="font-mono">
                  final_mix_v3_REAL_USE_THIS(2).mp3
                </span>
              </div>
            </div>

            <div className="chaos-float-2">
              <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-card/40 px-2.5 py-1 text-[10px] text-muted-foreground/50 backdrop-blur-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-destructive/80" />
                </span>
                47 unread
              </div>
            </div>

            <div className="chaos-float-3">
              <div className="rounded-lg border border-border/30 bg-card/40 px-2.5 py-1.5 text-[10px] text-muted-foreground/50 backdrop-blur-sm">
                🗓️ Practice Sat? Sun? idk
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClaritySection() {
  return (
    <section className="bg-primary/[0.03] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          With RiffSync, everything has a place.
        </h2>
        <p className="mx-auto mb-14 max-w-lg text-center text-base text-muted-foreground">
          Every version of every song, organized in a tree. You always know
          what&rsquo;s latest, who uploaded it, and where it came from.
        </p>

        <div className="mb-16 flex justify-center">
          <DemoVersionTree />
        </div>

        <AppMockup />
      </div>
    </section>
  );
}
