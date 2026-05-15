"use client";

import { DemoVersionTree } from "./demo-version-tree";

interface ChatMessage {
  name: string;
  text: string;
  delay: number;
}

const CHAT_MESSAGES: ChatMessage[] = [
  { name: "Alex", text: "yo did anyone save that new riff Jake played at practice", delay: 0 },
  { name: "Maya", text: "I think he voice memo'd it", delay: 0.5 },
  { name: "Alex", text: "that was two weeks ago lol", delay: 1.1 },
  { name: "Maya", text: "check the drive", delay: 1.7 },
  { name: "Alex", text: "which folder", delay: 2.2 },
  { name: "Jake", text: "idk Maya renamed everything", delay: 2.8 },
  { name: "Maya", text: "I didn't rename anything??", delay: 3.4 },
  { name: "Alex", text: "ok it's gone lol", delay: 4.0 },
];

const NAME_COLORS: Record<string, string> = {
  Alex: "text-blue-400/70",
  Maya: "text-emerald-400/70",
  Jake: "text-amber-400/70",
};

const BUBBLE_COLORS: Record<string, string> = {
  Alex: "bg-blue-600/90 text-white",
  Maya: "bg-emerald-700/80 text-white",
  Jake: "bg-amber-700/80 text-white",
};

export function ChaosSection() {
  return (
    <section className="bg-destructive/[0.04] px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Every band&rsquo;s group chat
        </h2>
        <p className="mb-12 text-center text-base text-muted-foreground">
          Demos buried in group chats. Nobody knows which version is the
          latest. The chaos adds up.
        </p>

        <div className="mx-auto max-w-sm">
          <div className="flex flex-col gap-1">
            {CHAT_MESSAGES.map((msg, i) => {
              const prevName = i > 0 ? CHAT_MESSAGES[i - 1].name : null;
              const showName = msg.name !== prevName;

              return (
                <div
                  key={i}
                  className={`chaos-bubble ${showName ? "mt-2" : ""}`}
                  style={{ animationDelay: `${msg.delay}s` }}
                >
                  {showName && (
                    <p
                      className={`mb-0.5 text-[11px] font-medium ${NAME_COLORS[msg.name] ?? "text-muted-foreground/60"}`}
                    >
                      {msg.name}
                    </p>
                  )}
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm ${BUBBLE_COLORS[msg.name] ?? "bg-muted/80 text-foreground/90"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
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

        <div className="flex justify-center">
          <div>
            <DemoVersionTree />
            <p className="mt-4 text-center text-xs text-muted-foreground/50">
              How your songs look inside RiffSync
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
