import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">
          RiffSync
        </h1>
        <p className="mt-4 text-xl font-medium text-muted-foreground sm:text-2xl">
          Your band&apos;s creative hub
        </p>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground/80">
          Collaborate on songs, manage versions, share lyrics and tabs, schedule
          rehearsals, and keep your whole band in sync — all in one self-hosted
          platform built for musicians.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="w-full sm:w-auto" render={<Link href="/register" />}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" render={<Link href="/login" />}>
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
}
