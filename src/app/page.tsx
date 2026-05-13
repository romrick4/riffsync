import Link from "next/link";
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
      "Upload recordings, see every draft in a timeline, compare versions side by side.",
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
      "Write and edit lyrics together. Full history so you can restore any previous version.",
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
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
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
        <section className="px-6 pb-24 pt-28 sm:pb-32 sm:pt-40">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              One place for your band.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Songs, lyrics, tabs, scheduling, and decisions. Stop digging
              through group chats and shared drives.
            </p>
            <div className="mt-10">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band
              </a>
            </div>
          </div>
        </section>

        <section className="border-t border-border/50 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name}>
                  <feature.icon className="size-5 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">{feature.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
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
