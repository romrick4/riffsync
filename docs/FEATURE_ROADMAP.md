# Feature Roadmap

Four features to build, in priority order. Each is scoped as a separate implementation session.

---

## 1. Shareable Demo Links (Session 1)

**What it is:** A band member generates a time-limited URL for a specific song version. Anyone with the link can listen without signing up. Link expires after a configurable period (default 7 days). The band can see active links and revoke them.

**Why it matters:** Closest to core product value. Directly justifies the $15/month paid tier. Every shared link is also a growth/awareness touchpoint.

### Scope

- `DemoLink` model in Prisma schema
- API routes: create, list, revoke, public token endpoint
- Public `/demo/[token]` page with audio player and expiry handling
- Share dialog on song version detail
- `getDemoUrl()` helper in `share.ts`

### Key decisions

- Demo links bypass all auth — the token IS the auth
- Audio served via signed S3 URL (prefer compressed/transcoded version)
- No download button on public demo page (stream only)
- Token is a UUID for unguessability

---

## 2. Setlist Builder (Session 2)

**What it is:** Create named setlists from songs already in the band. Drag to reorder. Lock a specific version per song ("this is the exact version we're learning for Saturday"). Optional per-song notes. Link a setlist to a calendar event.

**Why it matters:** Table-stakes feature that becomes RiffSync-specific through version locking.

### Scope

- `Setlist` and `SetlistItem` models
- CRUD + reorder API routes
- Setlists tab in project nav
- List page and detail page with drag-and-drop, version selector, notes

### Key decisions

- A song can appear in multiple setlists
- If the locked version is deleted, falls back to null (UI shows "Version removed")
- No PDF export in v1

---

## 3. Public Band Page (Session 3 — depends on Demo Links)

**What it is:** A toggleable public page per band at `/b/[slug]`. Shows bio, featured recordings, upcoming shows, photos, and contact info. Supports bundling private demo links into a "demo package" for bookers.

**Why it matters:** Zero-effort freshness — the page auto-updates from data the band already maintains. Private demo packages are the unique hook competitors don't have.

### Scope

- `BandPage` and `BandPageTrack` models
- Public `/b/[slug]` page
- Band page management UI in project settings (owner-only)

### Key decisions

- Uses existing project `slug` for the URL
- Only OWNER can configure the band page
- Upcoming shows pulled from `CalendarEvent` where `eventType = SHOW` and future dates
- Not a website builder — single-page EPK only

---

## 4. Band Chat (Session 4)

**What it is:** One chat room per band. Text messages, chronological. Members can reference songs, versions, events, and polls inline. Full history retained.

**Why it matters:** Creates daily engagement. Without it, bands still live in WhatsApp for most coordination.

### Scope

- `ChatMessage` model with `@@index([projectId, createdAt])`
- Paginated GET + POST API routes
- Real-time via Supabase Realtime (or polling fallback)
- Chat tab in project nav with message list, input bar, auto-scroll

### Key decisions

- One room per band. No DMs, no channels, no threads.
- No file attachments, editing, or deletion in v1
- No typing indicators or read receipts
- Free tier feature (drives retention, not revenue)
- Full history retained in Postgres (negligible at band scale)

---

## Dependency graph

```
Demo Links ──► Band Page
Setlist Builder (independent)
Band Chat (independent)
```

Demo links must ship before the band page (the page uses them for demo packages). Setlist builder and band chat are independent of each other and of the other two.
