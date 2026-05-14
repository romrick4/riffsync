import { Logo } from "@/components/logo";
import { ChaosVsClarity } from "@/components/marketing/chaos-vs-clarity";
import { DemoPlayer } from "@/components/marketing/demo-player";
import {
  CheckIcon,
  FileText,
  Music4,
  Calendar,
  Vote,
} from "lucide-react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface PricingFeature {
  text: string;
  comingSoon?: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: PricingFeature[];
  storage: string;
  extras?: string;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Everything you need to get started.",
    cta: "Start for free",
    storage: "2 GB storage",
    features: [
      { text: "Up to 2 bands" },
      { text: "Unlimited members per band" },
      { text: "Songs + versions" },
      { text: "Lyrics editor" },
      { text: "Shared calendar" },
      { text: "Polls" },
      { text: "Timestamped comments" },
      { text: "Notifications" },
    ],
  },
  {
    name: "Band",
    price: "$15",
    period: "/month",
    description: "For bands that are serious about their music.",
    cta: "Get Band",
    featured: true,
    storage: "50 GB storage",
    features: [
      { text: "Unlimited bands" },
      { text: "Everything in Free, plus:" },
      { text: "Shareable demo links", comingSoon: true },
      { text: "Setlist builder", comingSoon: true },
      { text: "Album organization" },
      { text: "Album ZIP downloads" },
    ],
  },
  {
    name: "Studio",
    price: "$30",
    period: "/month",
    description: "For power users and multi-project musicians.",
    cta: "Get Studio",
    storage: "150 GB storage",
    extras: "$2/month per extra 25 GB",
    features: [
      { text: "Unlimited bands" },
      { text: "Everything in Band, plus:" },
      { text: "Automated backups", comingSoon: true },
      { text: "500 MB upload limit", comingSoon: true },
      { text: "Granular roles", comingSoon: true },
      { text: "Priority support", comingSoon: true },
    ],
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

        {/* Pricing */}
        <section className="border-t border-border/50 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <h2 className="animate-fade-in-up mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Simple pricing. No surprises.
            </h2>
            <p className="animate-fade-in-up mx-auto mb-14 max-w-lg text-center text-base text-muted-foreground [animation-delay:100ms]">
              Only one person per band needs to pay. Everyone else gets full
              access.
            </p>

            <div className="grid gap-5 lg:grid-cols-3">
              {tiers.map((tier, i) => (
                <div
                  key={tier.name}
                  className={`animate-fade-in-up flex flex-col rounded-2xl border p-6 sm:p-7 ${
                    tier.featured
                      ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
                      : "border-border/50 bg-card/50"
                  }`}
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{tier.name}</h3>
                      {tier.featured && (
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">
                        {tier.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <div className="mb-6 flex flex-col gap-1 text-sm">
                    <div className="mb-2 flex items-center gap-2 font-medium text-card-foreground">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tier.storage}
                      </span>
                      {tier.extras && (
                        <span className="text-xs text-muted-foreground">
                          {tier.extras}
                        </span>
                      )}
                    </div>
                    {tier.features.map((f) => (
                      <div key={f.text} className="flex items-start gap-2 py-1">
                        <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        <span className="text-card-foreground/80">
                          {f.text}
                          {f.comingSoon && (
                            <span className="ml-1.5 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                              Coming soon
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <a
                      href={`${appUrl}/register`}
                      className={`inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        tier.featured
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "border border-border bg-card text-card-foreground hover:bg-accent"
                      }`}
                    >
                      {tier.cta}
                    </a>
                  </div>
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
