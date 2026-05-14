import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { DemoPlayer } from "./demo-player";
import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ token: string }>;
};

async function getDemoLink(token: string) {
  return prisma.demoLink.findUnique({
    where: { token },
    include: {
      songVersion: {
        select: {
          title: true,
          versionNumber: true,
          fileFormat: true,
          compressedFilePath: true,
          filePath: true,
          waveformPeaks: true,
          durationSec: true,
        },
      },
      song: {
        select: { title: true, coverArtPath: true },
      },
      project: {
        select: { name: true, logoPath: true },
      },
    },
  });
}

async function resolveUrl(path: string | null | undefined) {
  if (!path) return null;
  const storage = getStorage();
  return storage.getUrl(path);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const link = await getDemoLink(token);

  if (!link || link.isRevoked || link.expiresAt < new Date()) {
    return { title: "Demo — RiffSync" };
  }

  return {
    title: `${link.song.title} — ${link.project.name} | RiffSync`,
    description: `Listen to "${link.song.title}" by ${link.project.name} on RiffSync.`,
    openGraph: {
      title: `${link.song.title} — ${link.project.name}`,
      description: `Listen to "${link.song.title}" by ${link.project.name} on RiffSync.`,
      siteName: "RiffSync",
      type: "music.song",
    },
  };
}

export default async function DemoPage({ params }: PageProps) {
  const { token } = await params;
  const link = await getDemoLink(token);

  if (!link) {
    return <ExpiredState message="We couldn't find that link." />;
  }

  if (link.isRevoked) {
    return <ExpiredState message="This link is no longer active." />;
  }

  if (link.expiresAt < new Date()) {
    return <ExpiredState message="This link has expired." />;
  }

  const storage = getStorage();
  const audioKey = link.songVersion.compressedFilePath ?? link.songVersion.filePath;

  const [audioUrl, coverArtUrl, logoUrl] = await Promise.all([
    storage.getUrl(audioKey),
    resolveUrl(link.song.coverArtPath),
    resolveUrl(link.project.logoPath),
  ]);

  const neverExpires = link.expiresAt.getFullYear() - new Date().getFullYear() >= 50;

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {coverArtUrl && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <Image
            src={coverArtUrl}
            alt=""
            fill
            className="object-cover scale-105"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={link.project.name}
                width={64}
                height={64}
                className="size-16 rounded-full border border-white/20 object-cover shadow-lg"
                unoptimized
              />
            ) : (
              <h2 className="bg-gradient-to-r from-red-400 via-rose-400 to-orange-300 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
                {link.project.name}
              </h2>
            )}
            <div className="space-y-1">
              <h1 className={`text-lg font-medium tracking-tight sm:text-xl ${coverArtUrl ? "text-white" : "text-foreground"}`}>
                {link.song.title}
              </h1>
              <p className={`text-sm ${coverArtUrl ? "text-white/60" : "text-muted-foreground"}`}>
                {link.songVersion.title}
              </p>
            </div>
          </div>

          <DemoPlayer
            audioUrl={audioUrl}
            title={link.songVersion.title}
            format={link.songVersion.fileFormat}
            peaks={link.songVersion.waveformPeaks as number[] | null}
            durationSec={link.songVersion.durationSec}
          />

          {!neverExpires && (
            <p className={`text-center text-xs ${coverArtUrl ? "text-white/50" : "text-muted-foreground"}`}>
              This link expires{" "}
              {link.expiresAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ExpiredState({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="size-8 text-muted-foreground"
            >
              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">{message}</h1>
          <p className="text-sm text-muted-foreground">
            Ask the band to send you a new link.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/30 px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo size="sm" />
        </Link>
        <p className="text-xs text-muted-foreground">
          Your band&apos;s creative hub
        </p>
      </div>
    </footer>
  );
}
