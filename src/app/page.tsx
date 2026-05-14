import { Logo } from "@/components/logo";
import { ChaosVsClarity } from "@/components/marketing/chaos-vs-clarity";
import { DemoVersionTree } from "@/components/marketing/demo-version-tree";
import { DemoPlayer } from "@/components/marketing/demo-player";
import {
  Upload,
  GitBranch,
  MessageCircle,
  Star,
  FileText,
  Music4,
  Calendar,
  Vote,
} from "lucide-react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const steps = [
  {
    icon: Upload,
    title: "Upload a recording",
    description:
      "Drop in a voice memo, a studio bounce, or anything in between.",
  },
  {
    icon: GitBranch,
    title: "Branch and iterate",
    description:
      "Try a different arrangement without losing the original. Every version lives in the tree.",
  },
  {
    icon: MessageCircle,
    title: "Comment at the exact moment",
    description:
      'Click the waveform at 1:32 and say what you think. No more "around the 1:30 mark I think?"',
  },
  {
    icon: Star,
    title: "Pick your favorite",
    description: "Star the final version. Download it. Done.",
  },
];

const extras = [
  {
    icon: FileText,
    name: "Lyrics editor",
    description:
      "Write and edit lyrics together. Restore any previous version.",
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
      "Vote on setlists, song names, venues. Anything the band needs to decide.",
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
        <section className="relative overflow-hidden px-6 pb-20 pt-28 sm:pb-28 sm:pt-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[480px] w-[640px] rounded-full bg-gradient-to-tr from-red-400/20 via-rose-400/15 to-orange-300/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in-up bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Stop losing your best takes in group chats.
            </h1>
            <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground [animation-delay:150ms]">
              RiffSync tracks every version of every song. Comment at exact
              timestamps. See every draft in a visual tree. Your whole band,
              finally on the same page.
            </p>
            <div className="animate-fade-in-up mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center [animation-delay:300ms]">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band for free
              </a>
              <span className="text-xs text-muted-foreground">
                No credit card needed
              </span>
            </div>
          </div>
        </section>

        {/* Chaos vs Clarity */}
        <ChaosVsClarity />

        {/* Product showcase: Version Tree */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="animate-fade-in-up mb-3 text-xs font-medium uppercase tracking-widest text-primary [animation-delay:100ms]">
                  Version tree
                </p>
                <h2 className="animate-fade-in-up text-2xl font-bold tracking-tight sm:text-3xl [animation-delay:200ms]">
                  Every draft, every idea. All organized.
                </h2>
                <p className="animate-fade-in-up mt-4 text-base leading-relaxed text-muted-foreground [animation-delay:300ms]">
                  Upload a new recording and it appears in the version tree.
                  Branch off to try something different without losing the
                  original. Compare any two versions side by side. Star your
                  favorite when the band agrees.
                </p>
              </div>
              <div className="animate-fade-in-up [animation-delay:400ms]">
                <DemoVersionTree className="rounded-xl border border-border/50 bg-card/30 p-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Product showcase: Waveform + Comments */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <DemoPlayer className="animate-fade-in-up [animation-delay:400ms]" />
              </div>
              <div className="order-1 lg:order-2">
                <p className="animate-fade-in-up mb-3 text-xs font-medium uppercase tracking-widest text-primary [animation-delay:100ms]">
                  Timestamped comments
                </p>
                <h2 className="animate-fade-in-up text-2xl font-bold tracking-tight sm:text-3xl [animation-delay:200ms]">
                  Say exactly what you mean, right where you mean it.
                </h2>
                <p className="animate-fade-in-up mt-4 text-base leading-relaxed text-muted-foreground [animation-delay:300ms]">
                  Click anywhere on the waveform to pin a comment to that
                  moment. Your bandmates see it instantly. No more texting
                  &ldquo;around the 1:30 mark&rdquo; and hoping everyone knows
                  what you mean.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <h2 className="animate-fade-in-up mb-14 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              From rough idea to final mix
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="animate-fade-in-up relative flex flex-col items-center text-center"
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <div className="mb-1 flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="mt-3 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-400/15 via-rose-400/10 to-orange-300/15">
                    <step.icon className="size-5 text-foreground/80" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supporting features */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="animate-fade-in-up mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
              And everything else your band needs
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {extras.map((feature, i) => (
                <div
                  key={feature.name}
                  className="animate-fade-in-up rounded-xl border border-border/50 bg-card/50 p-5 transition-colors hover:border-primary/30"
                  style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-400/15 via-rose-400/10 to-orange-300/15">
                    <feature.icon className="size-4 text-foreground/80" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{feature.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
              Your next demo deserves better than a group chat.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Set up your band in under a minute. Upload your first song and
              start collaborating right away.
            </p>
            <div className="mt-8">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band for free
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
