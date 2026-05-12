# RiffSync

**Your band's creative hub.** One place for songs, lyrics, tabs, scheduling, and decisions — instead of scattered Google Drive folders and group texts.

## What You Get

- **Song Versions** — Upload recordings, see every draft in a visual timeline, compare versions side-by-side
- **Audio Player** — Waveform visualization with timestamped comments pinned right to the audio
- **Lyrics Editor** — Rich text editing with full history so you can restore any previous version
- **Tabs & Notation** — Text tabs, Guitar Pro files, and image uploads for handwritten charts
- **Shared Calendar** — Rehearsals, shows, and recording sessions with RSVP tracking
- **Polls** — Vote on setlists, song names, venues, or anything else as a band
- **Push Notifications** — Get notified when someone uploads a new version, leaves a comment, or creates an event
- **Email Notifications** — Get email alerts for the stuff that matters to you

---

## Getting Started

1. Sign up at [riffsync.com](https://riffsync.com)
2. Create your band
3. Share the invite link with your bandmates

That's it. No setup, no installs, no servers.

---

## For Developers

If you want to run RiffSync locally for development:

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- A [Supabase](https://supabase.com/) project (for Postgres and Auth)
- A [Cloudflare R2](https://www.cloudflare.com/products/r2/) bucket (for file storage)
- [FFmpeg](https://ffmpeg.org/) installed locally (for the transcoding worker)

### Setup

```bash
git clone https://github.com/romrick4/riffsync.git
cd riffsync
npm install
npm run setup
```

Fill in your Supabase and R2 credentials in `.env`, then:

```bash
npm run dev
```

To run the transcoding worker locally:

```bash
cd worker
npm install
node index.mjs
```

---

## Tech Stack

Next.js, Tailwind CSS, Base UI, Supabase (Postgres + Auth), Cloudflare R2, Prisma, wavesurfer.js, Tiptap, web-push, nodemailer

## License

MIT
