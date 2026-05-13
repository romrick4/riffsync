# RiffSync Pricing Plan

## Tiers

### Free

- **Price**: $0/month
- **Storage**: 2 GB (global across all bands)
- **Bands**: Up to 2
- **Members per band**: Unlimited
- **Features**: Songs + versions, lyrics, calendar, polls, timestamped comments, notifications

### Band — $15/month

- **Storage**: 50 GB (global across all bands)
- **Bands**: Unlimited
- **Members per band**: Unlimited

Everything in Free, plus:

- Shareable demo links (time-limited public links, expire after 7 days, no account required)
- Setlist builder (organize songs for gigs, reorder, per-song notes)
- Album organization (group songs, cover art, track ordering, metadata)
- Album ZIP downloads

### Studio — $30/month

- **Storage**: 150 GB (global across all bands)
- **Overage**: $2/month per additional 25 GB (no hard wall)
- **Bands**: Unlimited
- **Members per band**: Unlimited

Everything in Band, plus:

- Automated backups (weekly downloadable snapshot of all songs, lyrics, metadata)
- 500 MB per-file upload limit (vs 200 MB on Band/Free)
- Granular roles: "manager" (edit calendar/settings, can't delete songs) and "guest" (view and comment, can't upload)
- Priority support

---

## Pricing Model

- Only one user per band needs a subscription (the band owner).
- Storage caps are global per user, shared across all their bands.
- Non-paying band members get full feature access — the owner's subscription covers everyone.
- Typical band is 3-5 people, so effective per-person cost is $3.75-7.50/month.

---

## Data Retention (Cancelled Users)

1. **On cancellation**: Uploads frozen immediately. All content stays accessible (read/stream/download).
2. **After 90 days**: Email notice — data will be archived in 30 days unless they resubscribe or download.
3. **After 120 days**: Files moved to cold storage. Data recoverable if they resubscribe.
4. **After 1 year + 120 days of inactivity**: Final 30-day deletion warning. Permanent deletion if no response.

If the owner leaves but the band continues, another member can claim ownership by subscribing.

---

## Storage Accounting

- Only the original uploaded file counts against storage.
- Compressed copies (transcoded .m4a) do not count.
- Cover art counts against storage.

---

## Infrastructure Costs (Reference)

| Service | Monthly Cost | What It Covers |
|---------|-------------|----------------|
| Vercel Pro | $20 | Hosting, 1TB bandwidth |
| Supabase Pro | $25 | 8GB database, 100K MAUs, auth |
| Fly.io (worker) | ~$1-2 | Transcoding (per-second billing, auto-stop) |
| R2 Storage | $0.015/GB/month | Audio + images (egress is free) |
| Brevo | $0-15 | Email (free tier covers up to ~9K/month) |

**Fixed baseline**: ~$50/month
**Breakeven**: 4 paying subscribers

---

## Graduated Pricing Roadmap

1. **Launch**: $15 / $30. Grandfather early adopters at this price.
2. **At ~200 paying bands**: Raise to $20 / $40 for new signups.
3. **When demand supports it**: Introduce premium "Label" tier at $60-75/month (500GB, multi-manager, distribution prep, API access).
