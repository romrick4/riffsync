# RiffSync

**Your band's creative hub.** One place for songs, lyrics, tabs, scheduling, and decisions — instead of scattered Google Drive folders and group texts.

## What You Get

- **Song Versions** — Upload recordings, see every draft in a visual timeline, compare versions side-by-side
- **Audio Player** — Waveform visualization with timestamped comments pinned right to the audio
- **Lyrics Editor** — Rich text editing with full history so you can restore any previous version
- **Tabs & Notation** — Text tabs, Guitar Pro files, and image uploads for handwritten charts
- **Shared Calendar** — Rehearsals, shows, and recording sessions with RSVP tracking
- **Polls** — Vote on setlists, song names, venues, or anything else as a band
- **Push Notifications** — Get notified in your browser when someone uploads a new version, leaves a comment, or creates an event
- **Email Notifications** — Optionally get email alerts too (works with Gmail, Outlook, or any email provider)

---

## Setup

RiffSync runs on a small server so everyone in your band can access it from any device. You only need to do this once — after that, everyone just opens the link.

### What You Need

- **A small server** — Rent one for $4-6/month from [DigitalOcean](https://www.digitalocean.com/), [Hetzner](https://www.hetzner.com/), or [Linode](https://www.linode.com/). Pick a plan with at least **50 GB of storage** so you have plenty of room for recordings. 1 GB of RAM is plenty. Choose **Ubuntu** when asked which operating system.
- **A way to connect to your server** — On Mac/Linux, open Terminal. On Windows, use [PuTTY](https://www.putty.org/) or Windows Terminal. Your server provider will give you an IP address and password.

### One-Command Install

Connect to your server (replace `your-server-ip` with the IP address your server provider gave you):

```bash
ssh root@your-server-ip
```

Then paste this single command and press Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/romrick4/riffsync/main/setup.sh | bash
```

That's it. The script does everything automatically:

1. Installs Docker (if needed)
2. Downloads RiffSync
3. Generates all passwords and encryption keys
4. Starts the database and the app

When it finishes, you'll see a message with your URL. Open it in your browser, create an account, and share the invite code with your bandmates.

### Updating

To update to the latest version, connect to your server and run:

```bash
cd ~/riffsync
git pull && docker compose up -d --build
```

---

## Notifications

### Push Notifications

Push notifications work automatically — no setup needed. When a bandmate uploads a recording, leaves a comment, creates an event, or starts a poll, you'll get a notification in your browser.

To turn them on: click your avatar in the top-right corner and select **"Enable push notifications"**. Your browser will ask for permission — click Allow.

### Email Notifications (Optional)

Want email alerts too? Add your email settings to the config file on your server. This works with any email provider.

Connect to your server and edit the config:

```bash
cd ~/riffsync
nano .env
```

Scroll to the bottom and fill in the email section. Here are examples for common providers:

**Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=RiffSync <you@gmail.com>
```
> Gmail requires an "App Password" instead of your regular password. [Create one here](https://myaccount.google.com/apppasswords) (you need 2-Step Verification turned on first).

**Outlook / Hotmail:**
```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=you@outlook.com
SMTP_PASS=your-password
SMTP_FROM=RiffSync <you@outlook.com>
```

After saving, restart the app:

```bash
docker compose restart app
```

If you skip this step, everything still works — you just won't get email alerts.

---

## Custom Domain (Optional)

By default, you access RiffSync at `http://your-server-ip:3000`. If you want a real URL like `riffsync.yourband.com`:

1. Buy a domain (or use one you already have)
2. In your domain's DNS settings, add an **A record** pointing to your server's IP address
3. Install [Caddy](https://caddyserver.com/) on your server (a free tool that handles HTTPS automatically):

```bash
apt install -y caddy
```

4. Edit the Caddy config:

```bash
nano /etc/caddy/Caddyfile
```

Replace the contents with:

```
riffsync.yourband.com {
    reverse_proxy localhost:3000
}
```

5. Restart Caddy:

```bash
systemctl restart caddy
```

Caddy automatically sets up HTTPS with a free certificate. Your band can now access RiffSync at `https://riffsync.yourband.com`.

---

## For Developers

If you want to run RiffSync on your own computer for development:

```bash
git clone https://github.com/romrick4/riffsync.git
cd riffsync
npm install
npm run setup
npm run dev
```

Requires [Node.js 18+](https://nodejs.org/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/).

---

## Configuration Reference

All settings live in the `.env` file. Most are set automatically by the setup script.

| Setting | Required | What It Does |
|---|---|---|
| `POSTGRES_PASSWORD` | Yes | Database password (auto-generated) |
| `SESSION_SECRET` | Yes | Encryption key for login sessions (auto-generated) |
| `DATABASE_URL` | Yes | Database connection address (auto-generated) |
| `VAPID_PUBLIC_KEY` | No | Push notification key (auto-generated) |
| `VAPID_PRIVATE_KEY` | No | Push notification key (auto-generated) |
| `SMTP_HOST` | No | Email server address (for email alerts) |
| `SMTP_PORT` | No | Email server port (usually 587) |
| `SMTP_USER` | No | Email username |
| `SMTP_PASS` | No | Email password |
| `SMTP_FROM` | No | The "from" address on notification emails |
| `STORAGE_PROVIDER` | No | `local` (default) or `s3` for cloud storage |
| `APP_PORT` | No | Port the app runs on (default: 3000) |

## Support the Project

If RiffSync is useful to your band, consider buying me a coffee. It helps keep the project going.

<a href="https://www.buymeacoffee.com/YOUR_USERNAME" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" height="48"></a>

## Tech Stack

Next.js, Tailwind CSS, Base UI, PostgreSQL, Prisma, wavesurfer.js, Tiptap, web-push, nodemailer

## License

MIT
