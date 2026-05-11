# RiffSync

**Your band's creative hub.** A self-hosted collaboration platform for musicians and bands.

RiffSync replaces the chaos of Google Drive folders and group text threads with a single place to manage your band's songs, lyrics, tabs, schedule, and decisions.

## Features

- **Song Version Control** — Upload song drafts, track versions in a visual tree, branch and merge, mark final versions. No more "which file is the latest?"
- **In-Browser Audio Player** — Waveform visualization, A/B comparison between versions, and timestamped comments pinned to the waveform
- **Lyrics Editor** — Rich text editor with full version history, diffs, and one-click restore
- **Tabs & Notation** — Text tab editor, Guitar Pro file viewer, and image uploads for handwritten charts
- **Shared Calendar** — Schedule rehearsals, shows, and recording sessions with RSVP tracking
- **Polls** — Make band decisions democratically — vote on setlists, venues, or anything
- **Shareable Links** — Copy a link to any version, lyric draft, or event and text it to your bandmates
- **Simple Auth** — Username and password. No external accounts or services needed

## Quick Start

### Option A: VPS Setup (Recommended)

Rent a small server ($4-6/mo from DigitalOcean, Hetzner, Linode, etc.), SSH in, and run:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USER/riffsync/main/setup.sh | bash
```

The script installs Docker (if needed), clones the repo, generates secure secrets, and starts everything. Your RiffSync instance will be live in about 5 minutes.

### Option B: Docker Compose (Manual)

```bash
git clone https://github.com/YOUR_USER/riffsync.git
cd riffsync
cp .env.example .env
```

Edit `.env` and set a strong `POSTGRES_PASSWORD` and `SESSION_SECRET`:

```bash
# Generate a session secret
openssl rand -base64 32
```

Then start everything:

```bash
docker compose up -d --build
```

Open `http://localhost:3000`, create an account, and you're ready to go.

### Option C: PaaS Deploy (Render, Railway)

For a zero-terminal setup, deploy to a PaaS platform. You'll need one additional (free) account for audio file storage:

1. Create a free [Cloudflare R2](https://developers.cloudflare.com/r2/) account (10GB free, no credit card)
2. Create an R2 bucket and generate API keys
3. Deploy to your PaaS and set the environment variables from `.env.example`, plus:
   - `STORAGE_PROVIDER=s3`
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

## Configuration

All configuration is done through environment variables. See [`.env.example`](.env.example) for the full list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_PASSWORD` | Yes | — | Database password |
| `SESSION_SECRET` | Yes | — | Secret key for signing session tokens |
| `APP_PORT` | No | 3000 | Port the app listens on |
| `STORAGE_PROVIDER` | No | local | `local` for filesystem, `s3` for S3-compatible |
| `STORAGE_PATH` | No | ./storage | Path for local file storage |
| `S3_ENDPOINT` | If S3 | — | S3-compatible endpoint URL |
| `S3_REGION` | If S3 | — | S3 region |
| `S3_BUCKET` | If S3 | — | S3 bucket name |
| `S3_ACCESS_KEY_ID` | If S3 | — | S3 access key |
| `S3_SECRET_ACCESS_KEY` | If S3 | — | S3 secret key |

## Development

```bash
npm install
cp .env.example .env
# Edit .env with your local Postgres connection

npx prisma generate
npx prisma migrate dev

npm run dev
```

## Tech Stack

- **Next.js 15** (App Router) — Full-stack TypeScript framework
- **Tailwind CSS** + **shadcn/ui** — Modern, accessible UI components
- **PostgreSQL** + **Prisma** — Database and ORM
- **wavesurfer.js** — Audio waveform visualization
- **Tiptap** — Rich text editor for lyrics

## License

MIT
