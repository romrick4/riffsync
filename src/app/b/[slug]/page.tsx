import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { BandPageTracks } from "./band-page-tracks";
import {
  CalendarIcon,
  MailIcon,
  GlobeIcon,
  MapPinIcon,
  MusicIcon,
} from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getBandPageData(slug: string) {
  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoPath: true,
      bandPage: {
        include: {
          tracks: {
            orderBy: { position: "asc" },
            include: {
              song: {
                select: {
                  id: true,
                  title: true,
                  coverArtPath: true,
                },
              },
              version: {
                select: {
                  id: true,
                  title: true,
                  versionNumber: true,
                  filePath: true,
                  compressedFilePath: true,
                  fileFormat: true,
                  waveformPeaks: true,
                  durationSec: true,
                  uploadStatus: true,
                },
              },
            },
          },
        },
      },
      calendarEvents: {
        where: {
          eventType: "SHOW",
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: "asc" },
        take: 10,
        select: {
          id: true,
          title: true,
          startTime: true,
          location: true,
        },
      },
    },
  });

  return project;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getBandPageData(slug);

  if (!project || !project.bandPage?.isPublished) {
    return { title: "Band Page — RiffSync" };
  }

  const bio = project.bandPage.bio || project.description;
  const description = bio
    ? bio.length > 160 ? bio.slice(0, 157) + "..." : bio
    : `Check out ${project.name} on RiffSync.`;

  return {
    title: `${project.name} | RiffSync`,
    description,
    openGraph: {
      title: project.name,
      description,
      siteName: "RiffSync",
      type: "profile",
    },
  };
}

export default async function BandPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const project = await getBandPageData(slug);

  if (!project || !project.bandPage?.isPublished) {
    notFound();
  }

  const bandPage = project.bandPage;
  const storage = getStorage();
  const socialLinks = (bandPage.socialLinks ?? {}) as Record<string, string>;

  const [logoUrl, heroImageUrl] = await Promise.all([
    project.logoPath ? storage.getUrl(project.logoPath) : null,
    bandPage.heroImagePath ? storage.getUrl(bandPage.heroImagePath) : null,
  ]);

  const readyTracks = bandPage.tracks.filter(
    (t) => t.version && t.version.uploadStatus === "READY",
  );

  const tracksWithUrls = await Promise.all(
    readyTracks.map(async (track) => {
      const version = track.version!;
      const audioKey = version.compressedFilePath ?? version.filePath;
      const [audioUrl, coverArtUrl] = await Promise.all([
        storage.getUrl(audioKey),
        track.song.coverArtPath ? storage.getUrl(track.song.coverArtPath) : null,
      ]);
      return {
        id: track.id,
        songTitle: track.song.title,
        versionTitle: version.title,
        format: version.fileFormat,
        audioUrl,
        coverArtUrl,
        peaks: version.waveformPeaks as number[] | null,
        durationSec: version.durationSec,
      };
    }),
  );

  const bio = bandPage.bio || project.description;
  const upcomingShows = project.calendarEvents;
  const hasContact = bandPage.contactEmail || socialLinks.website;
  const hasSocials = socialLinks.instagram || socialLinks.spotify || socialLinks.youtube;
  const hasContactSection = hasContact || hasSocials;

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {heroImageUrl && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <Image
              src={heroImageUrl}
              alt=""
              fill
              className="object-cover scale-105"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center px-4 pb-10 pt-16 text-center sm:px-6 sm:pb-14 sm:pt-24">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={project.name}
              width={96}
              height={96}
              className="size-20 rounded-full border-2 border-white/20 object-cover shadow-xl sm:size-24"
              unoptimized
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 via-rose-400 to-orange-300 shadow-xl sm:size-24">
              <MusicIcon className="size-8 text-white sm:size-10" />
            </div>
          )}

          <h1
            className={`mt-5 text-2xl font-bold tracking-tight sm:text-4xl ${
              heroImageUrl ? "text-white" : "text-foreground"
            }`}
          >
            {project.name}
          </h1>

          {bio && (
            <p
              className={`mx-auto mt-3 max-w-md text-sm leading-relaxed sm:text-base ${
                heroImageUrl ? "text-white/75" : "text-muted-foreground"
              }`}
            >
              {bio}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-12">
          {/* Featured Tracks */}
          {tracksWithUrls.length > 0 && (
            <section>
              <SectionHeading>Featured Recordings</SectionHeading>
              <BandPageTracks tracks={tracksWithUrls} />
            </section>
          )}

          {/* Upcoming Shows */}
          {upcomingShows.length > 0 && (
            <section>
              <SectionHeading>Upcoming Shows</SectionHeading>
              <div className="space-y-3">
                {upcomingShows.map((show) => (
                  <div
                    key={show.id}
                    className="flex items-start gap-4 rounded-xl border bg-card p-4"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{show.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {new Date(show.startTime).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {" at "}
                        {new Date(show.startTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      {show.location && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPinIcon className="size-3.5 shrink-0" />
                          <span className="truncate">{show.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact & Socials */}
          {hasContactSection && (
            <section>
              <SectionHeading>Get in Touch</SectionHeading>
              <div className="flex flex-wrap gap-3">
                {bandPage.contactEmail && (
                  <ContactPill
                    href={`mailto:${bandPage.contactEmail}`}
                    icon={<MailIcon className="size-4" />}
                    label={bandPage.contactEmail}
                  />
                )}
                {socialLinks.website && (
                  <ContactPill
                    href={normalizeUrl(socialLinks.website)}
                    icon={<GlobeIcon className="size-4" />}
                    label={displayUrl(socialLinks.website)}
                  />
                )}
                {socialLinks.instagram && (
                  <ContactPill
                    href={`https://instagram.com/${stripAt(socialLinks.instagram)}`}
                    icon={<InstagramIcon />}
                    label={`@${stripAt(socialLinks.instagram)}`}
                  />
                )}
                {socialLinks.spotify && (
                  <ContactPill
                    href={normalizeUrl(socialLinks.spotify)}
                    icon={<SpotifyIcon />}
                    label="Spotify"
                  />
                )}
                {socialLinks.youtube && (
                  <ContactPill
                    href={normalizeUrl(socialLinks.youtube)}
                    icon={<YoutubeIcon />}
                    label="YouTube"
                  />
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-border/30 px-4 py-6">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo size="sm" />
          </Link>
          <p className="text-xs text-muted-foreground">
            Your band&apos;s creative hub
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-lg font-semibold tracking-tight sm:text-xl">
      {children}
    </h2>
  );
}

function ContactPill({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}

function normalizeUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function stripAt(handle: string) {
  return handle.replace(/^@/, "");
}

function InstagramIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
