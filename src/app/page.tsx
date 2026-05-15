import { Logo } from "@/components/logo";
import { AppMockup } from "@/components/marketing/app-mockup";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const VALUE_PROPS = [
  {
    keyword: "Songs",
    text: "Upload, version, and organize every recording in one place.",
  },
  {
    keyword: "Feedback",
    text: "Pin comments to exact moments. No more guessing.",
  },
  {
    keyword: "Schedule",
    text: "One calendar for rehearsals, shows, and sessions.",
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full bg-background/60 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo size="sm" />
          <a
            href={`${appUrl}/login`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </a>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 pt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Organize your band&rsquo;s creative process.
            </h1>
            <p className="animate-fade-in-up mx-auto mt-6 max-w-md text-lg text-muted-foreground [animation-delay:120ms]">
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

        {/* Product visual */}
        <section className="px-6 pb-32 pt-8">
          <AppMockup />
        </section>

        {/* Value props */}
        <section className="bg-white/[0.02] px-6 py-24 sm:py-32">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-16">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.keyword} className="text-center">
                <h2 className="text-lg font-bold text-primary">
                  {prop.keyword}
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                  {prop.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing (simplified) */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-base text-muted-foreground">
              Free for up to 2 bands. Paid plans start at{" "}
              <span className="font-semibold text-foreground">$15/mo</span> for
              serious bands.
            </p>
            <div className="mt-8">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-12 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Start your band for free
              </a>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your band deserves better than a group chat.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
              Set up your band in under a minute. Upload your first song and
              start collaborating right away.
            </p>
            <div className="mt-8">
              <a
                href={`${appUrl}/register`}
                className="inline-flex h-12 items-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
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
