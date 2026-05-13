# Feature TODO

Features to build for paid tier differentiation and billing infrastructure.

---

## Billing / Subscription System

- [ ] Integrate Stripe (subscriptions, payment methods, invoices)
- [ ] Add subscription/plan models to Prisma schema (plan tier, status, storage quota, overage tracking)
- [ ] Build storage usage tracking per user (sum of original file sizes across all bands)
- [ ] Enforce storage caps on upload (check quota before issuing presigned URL)
- [ ] Surface storage usage in user settings (breakdown by band)
- [ ] Implement upload freeze when subscription lapses
- [ ] Implement data retention lifecycle (90-day grace, cold storage migration, deletion after 1 year)
- [ ] Ownership transfer flow (another member claims the band by subscribing)

---

## Band Tier Features ($15/month)

- [ ] **Shareable demo links** — generate time-limited public URLs for a song version. Accessible without an account. Expire after 7 days. Include basic player UI on the public page.
- [ ] **Setlist builder** — create named setlists tied to a band. Drag-to-reorder songs. Per-song notes field (key, tempo, cues). Optionally link a setlist to a calendar event.

---

## Studio Tier Features ($30/month)

- [ ] **Automated backups** — weekly scheduled job that generates a downloadable ZIP manifest of all user content (originals, lyrics as text, metadata as JSON). Store backup ZIPs in R2. Keep last 4 weekly backups.
- [ ] **500 MB upload limit** — increase per-file size cap from 200 MB to 500 MB for Studio subscribers. Gate in the `initiate` upload route based on user plan.
- [ ] **Granular roles** — add "manager" and "guest" roles to `ProjectMember`. Manager: can edit calendar, settings, and invite members, but cannot delete songs or the band. Guest: read-only + comments, cannot upload.
- [ ] **Storage overage** — when a Studio user exceeds 150 GB, allow uploads to continue. Track overage amount. Bill $2/month per 25 GB block via Stripe usage-based billing.

---

## Priority Order (Suggested)

1. Storage tracking and enforcement (required before any paid tier works)
2. Stripe integration and subscription models
3. Shareable demo links (highest-impact Band feature, drives virality)
4. Setlist builder (straightforward CRUD, high user value)
5. Granular roles (schema change + permission checks)
6. 500 MB upload limit (trivial gate once billing exists)
7. Automated backups (background job, can ship after launch)
8. Storage overage billing (Stripe usage-based metering)
9. Data retention lifecycle (can run manually at first, automate later)
