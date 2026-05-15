import { Logo } from "@/components/logo";
import {
  ChaosSection,
  ClaritySection,
} from "@/components/marketing/chaos-vs-clarity";
import { DemoPlayer } from "@/components/marketing/demo-player";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full bg-black/40 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo size="sm" />
          <a
            href={`${appUrl}/login`}
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            Sign in
          </a>
        </div>
      </nav>

      <main>
        {/* Hero — band photo background */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/65"
          />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Organize your band&rsquo;s creative process.
            </h1>
            <p className="animate-fade-in-up mx-auto mt-6 max-w-md text-lg text-white/70 [animation-delay:120ms]">
              Upload recordings. Leave feedback at exact timestamps. Plan
              rehearsals. All in one place.
            </p>
            <div className="animate-fade-in-up mt-10 [animation-delay:240ms]">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-12 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band for free
              </a>
            </div>
          </div>
        </section>

        {/* Chaos — "Your band right now" */}
        <ChaosSection />

        {/* Clarity — "With RiffSync" */}
        <ClaritySection />

        {/* Feature — Timestamped comments */}
        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <DemoPlayer />
              </div>
              <div className="order-1 flex flex-col justify-center lg:order-2">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Say exactly what you mean, right where you mean it.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
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
        <section className="bg-white/[0.02] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
              Simple pricing
            </h2>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
              <div>
                <span className="text-2xl font-bold text-foreground">Free</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Up to 2 bands &middot; 2 GB
                </p>
              </div>
              <div className="hidden h-10 w-px bg-border/50 sm:block" />
              <div>
                <span className="text-2xl font-bold text-foreground">$15</span>
                <span className="text-sm text-muted-foreground">/mo</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unlimited bands &middot; 50 GB
                </p>
              </div>
              <div className="hidden h-10 w-px bg-border/50 sm:block" />
              <div>
                <span className="text-2xl font-bold text-foreground">$30</span>
                <span className="text-sm text-muted-foreground">/mo</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Everything &middot; 150 GB
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Only one person per band needs to pay. Everyone else gets full
              access.
            </p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative overflow-hidden px-6 py-28 sm:py-36">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-transparent"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your band deserves better than a group chat.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
              Set up your band in under a minute. Upload your first song and
              start collaborating right away.
            </p>
            <div className="mt-10">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-14 items-center rounded-xl bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/80 hover:shadow-xl hover:shadow-primary/30"
              >
                Start your band for free
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-10">
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
