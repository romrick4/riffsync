# RiffSync

**Your band's creative hub.** A self-hosted collaboration platform for musicians and bands.

RiffSync replaces the chaos of Google Drive folders and group text threads with a single place to manage your band's songs, lyrics, tabs, schedule, and decisions.

## Features

- **Song Version Control** — Upload song drafts, track versions in a visual tree, branch and merge, mark final versions
- **In-Browser Audio Player** — Waveform visualization, A/B comparison between versions, and timestamped comments pinned to the waveform
- **Lyrics Editor** — Rich text editor with full version history, diffs, and one-click restore
- **Tabs & Notation** — Text tab editor, Guitar Pro file viewer, and image uploads for handwritten charts
- **Shared Calendar** — Schedule rehearsals, shows, and recording sessions with RSVP tracking
- **Polls** — Make band decisions democratically — vote on setlists, venues, or anything
- **Push Notifications** — Get browser push notifications when bandmates upload versions, leave comments, create events, or start polls. Works automatically with zero setup
- **Email Notifications (Optional)** — Get email alerts too. Works with any SMTP provider (Gmail, Outlook, Fastmail, Resend, SendGrid, etc.)
- **Simple Auth** — Username and password. No external accounts or services needed

---

## Quick Start (Local Development)

This is the fastest way to get RiffSync running on your computer. You need two things installed first:

1. **Node.js** (version 18 or newer) — [Download here](https://nodejs.org/)
2. **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/) (this runs the database for you)

Once those are installed, open your terminal and run these commands one at a time:

```bash
# 1. Download the code
git clone https://github.com/YOUR_USER/riffsync.git

# 2. Go into the project folder
cd riffsync

# 3. Install dependencies
npm install

# 4. Run the setup script (creates your config, starts the database, sets everything up)
npm run setup

# 5. Start the app
npm run dev
```

That's it! Open **http://localhost:3000** in your browser, create an account, and start collaborating.

### What does `npm run setup` do?

The setup script handles everything automatically:

- Creates your `.env` config file with secure random passwords
- Starts a PostgreSQL database via Docker
- Generates encryption keys for push notifications
- Runs database migrations to create all the tables
- Creates a `storage/` folder for uploaded audio files

You only need to run it once. After that, just use `npm run dev` to start the app.

---

## Production Setup (Docker Compose)

To run RiffSync on a server so your whole band can use it:

### Step 1: Get a server

Rent a small VPS ($4-6/month) from [DigitalOcean](https://www.digitalocean.com/), [Hetzner](https://www.hetzner.com/), [Linode](https://www.linode.com/), or similar. The smallest tier is plenty.

### Step 2: Install Docker on your server

SSH into your server and install Docker. On Ubuntu/Debian:

```bash
curl -fsSL https://get.docker.com | sh
```

### Step 3: Clone and configure

```bash
git clone https://github.com/YOUR_USER/riffsync.git
cd riffsync
cp .env.example .env
```

Now edit `.env` and change these two values to something secure:

```bash
# Open the file in a text editor
nano .env

# Change these two lines (use random strings — the longer the better):
POSTGRES_PASSWORD=pick-a-strong-password-here
SESSION_SECRET=pick-another-random-string-here
```

Also update the `DATABASE_URL` line to use your new password:

```
DATABASE_URL="postgresql://postgres:pick-a-strong-password-here@db:5432/riffsync?schema=public"
```

Generate push notification keys (copy the output into your `.env`):

```bash
npx web-push generate-vapid-keys
```

### Step 4: Start everything

```bash
docker compose up -d --build
```

This starts the database, runs migrations, and launches the app. Open `http://your-server-ip:3000` in your browser.

### Step 5 (Optional): Set up a domain with HTTPS

For a real URL like `riffsync.yourband.com`, point your domain's DNS to your server and use a reverse proxy like [Caddy](https://caddyserver.com/) (easiest) or Nginx with Let's Encrypt.

---

## Notifications

### Push Notifications (automatic)

Push notifications work out of the box. When a bandmate uploads a new version, leaves a comment, creates an event, or starts a poll, you'll get a browser notification.

To enable push notifications, click the user icon in the top-right corner and select **"Enable push notifications"**. Your browser will ask for permission — click Allow.

### Email Notifications (optional)

If you want email notifications too, add SMTP credentials to your `.env` file. This works with any email provider:

**Gmail example:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=RiffSync <you@gmail.com>
```

> For Gmail, you'll need an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password). Go to Google Account > Security > 2-Step Verification > App passwords.

**Outlook/Hotmail example:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=you@outlook.com
SMTP_PASS=your-password
SMTP_FROM=RiffSync <you@outlook.com>
```

**Fastmail example:**
```bash
SMTP_HOST=smtp.fastmail.com
SMTP_PORT=587
SMTP_USER=you@fastmail.com
SMTP_PASS=your-app-password
SMTP_FROM=RiffSync <you@fastmail.com>
```

If you leave the SMTP settings blank, email is simply disabled — everything else works fine.

---

## Configuration Reference

All configuration is done through environment variables in `.env`. Here's the full list:

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_PASSWORD` | Yes | — | Database password |
| `SESSION_SECRET` | Yes | — | Secret key for signing session tokens |
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string |
| `APP_PORT` | No | 3000 | Port the app listens on |
| `STORAGE_PROVIDER` | No | local | `local` for filesystem, `s3` for S3-compatible |
| `STORAGE_PATH` | No | ./storage | Path for local file storage |
| `VAPID_PUBLIC_KEY` | No | — | Push notification public key (auto-generated by setup) |
| `VAPID_PRIVATE_KEY` | No | — | Push notification private key (auto-generated by setup) |
| `VAPID_SUBJECT` | No | mailto:admin@localhost | Contact email for push notifications |
| `SMTP_HOST` | No | — | SMTP server hostname (enables email notifications) |
| `SMTP_PORT` | No | 587 | SMTP server port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | — | From address for emails |
| `S3_ENDPOINT` | If S3 | — | S3-compatible endpoint URL |
| `S3_REGION` | If S3 | — | S3 region |
| `S3_BUCKET` | If S3 | — | S3 bucket name |
| `S3_ACCESS_KEY_ID` | If S3 | — | S3 access key |
| `S3_SECRET_ACCESS_KEY` | If S3 | — | S3 secret key |

---

## Tech Stack

- **Next.js 16** (App Router) — Full-stack TypeScript framework
- **Tailwind CSS** + **Base UI** — Modern, accessible UI components
- **PostgreSQL** + **Prisma** — Database and ORM
- **wavesurfer.js** — Audio waveform visualization
- **Tiptap** — Rich text editor for lyrics
- **web-push** — Browser push notifications
- **nodemailer** — Email notifications via SMTP

## License

MIT
