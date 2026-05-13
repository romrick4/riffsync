import { Logo } from "@/components/logo";
import {
  GitCompare,
  AudioWaveform,
  FileText,
  Music4,
  Calendar,
  Vote,
} from "lucide-react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const features = [
  {
    icon: GitCompare,
    name: "Song versions",
    description:
      "Upload recordings, see every draft in a timeline, compare side by side.",
  },
  {
    icon: AudioWaveform,
    name: "Waveform player",
    description:
      "Listen back with a visual waveform. Pin comments to exact timestamps.",
  },
  {
    icon: FileText,
    name: "Lyrics editor",
    description:
      "Write and edit lyrics together. Restore any previous version instantly.",
  },
  {
    icon: Music4,
    name: "Tabs and notation",
    description:
      "Text tabs, Guitar Pro files, and image uploads for handwritten charts.",
  },
  {
    icon: Calendar,
    name: "Shared calendar",
    description:
      "Rehearsals, shows, and sessions in one place. RSVP so everyone knows who's coming.",
  },
  {
    icon: Vote,
    name: "Polls",
    description:
      "Vote on setlists, song names, venues — anything the band needs to decide together.",
  },
];

export default function MarketingPage() {
  return (
    <div className="dot-grid min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-[max(1.5rem,env(safe-area-inset-right))]">
          <Logo size="sm" />
          <a
            href={appUrl}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Open RiffSync
          </a>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-28 sm:pb-32 sm:pt-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[480px] w-[640px] rounded-full bg-gradient-to-tr from-red-400/20 via-rose-400/15 to-orange-300/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in-up bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              One place for your band.
            </h1>
            <p className="animate-fade-in-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground [animation-delay:150ms]">
              Songs, scheduling, and decisions — without the group-chat chaos.
            </p>
            <div className="animate-fade-in-up mt-10 [animation-delay:300ms]">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/50 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <p className="animate-fade-in-up mb-12 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground [animation-delay:400ms]">
              Built for how bands actually work
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={feature.name}
                  className="animate-fade-in-up rounded-xl border border-border/50 bg-card/50 p-6 transition-colors hover:border-primary/30"
                  style={{ animationDelay: `${450 + i * 80}ms` }}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-400/15 via-rose-400/10 to-orange-300/15">
                    <feature.icon className="size-5 text-foreground/80" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">
                    {feature.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready when your band is.
            </h2>
            <div className="mt-8">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} RiffSync
          </p>
        </div>
      </footer>
    </div>
  );
}
