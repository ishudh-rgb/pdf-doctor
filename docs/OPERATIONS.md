# OnlyMyPDF — Operations Runbook

Production operations guide for monitoring, deployments, backups, and incident response. Conversion pipelines (LibreOffice, Puppeteer, pdf-lib services) are unchanged by this document.

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness: app + env sanity (returns `200` JSON) |
| Vercel/host dashboard | Process uptime, memory, cold starts |

**Probe example (public liveness)**

```bash
curl -fsS https://yourdomain.com/api/health
```

**Detailed diagnostics (requires secret)**

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/health
```

Public response: `{ "status": "ok", "timestamp": "..." }`. Authenticated response includes `checks` (secrets, Upstash, database, storage cleanup).

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main` or `master`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test` (Vitest unit tests)
5. `npm run test:e2e` (Playwright smoke: home, tools, health, legal)
6. `npm audit --audit-level=high` (non-blocking)
7. `npm run build`

Local equivalent:

```bash
make ci
# or
npm run lint && npm run typecheck && npm run test && npm run build
```

Dependabot (`.github/dependabot.yml`) opens weekly npm/GitHub Actions update PRs.

## Scheduled jobs

| Job | Route | Auth |
|-----|-------|------|
| File cleanup + consent purge (3yr) + usage logs (90d) + AI usage logs (90d) + error logs (90d) | `GET /api/cron/cleanup` | `Authorization: Bearer $CRON_SECRET` or Vercel `x-vercel-cron` (on Vercel only) |

Also deletes orphaned preview PDFs under `temp-sessions/pdf/` in Supabase storage when older than the 30-minute session TTL.

Configure in Vercel Cron or external scheduler with Bearer auth. Never expose `CRON_SECRET` in client code or query strings.

## Database migrations

Run in order in Supabase SQL Editor (or `supabase db push`):

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Core tables, storage |
| `002_security_hardening.sql` | RLS policies |
| `003_security_rls_payments.sql` | Payment tables RLS |
| `004_security_rls_admin_tables.sql` | Admin RLS |
| `005_scalability_privacy.sql` | Indexes, `consent_records`, retention helpers |
| `006_payment_retention_on_delete.sql` | Billing records retained on account delete |
| `007_payment_processing_status.sql` | Atomic payment fulfillment (`processing` status) |
| `008_user_blocked_storage.sql` | `is_blocked` on profiles + storage policy notes |
| `009_profile_block_coupon_atomic.sql` | Block self-unblock via RLS; atomic coupon increment RPC |
| `010_admin_audit_log.sql` | Admin audit trail table (service-role writes) |

After each migration, verify in Table Editor and run a smoke test (upload → convert → download).

**Production gate:** Do not deploy until authenticated `/api/health` returns `healthy` (not `degraded`) with Upstash, Supabase, and required secrets configured.

## Environment variables

Required in production:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
IP_HASH_SALT=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Recommended for scale and observability:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
RESEND_API_KEY=
CONTACT_INBOX_EMAIL=
MAX_CONCURRENT_HEAVY_JOBS=2
```

When **Upstash** and **Supabase storage** are both configured:

- **Heavy conversions** share a distributed semaphore (Redis key `pdf-doctor:heavy-jobs:leases`). Without Upstash in production, heavy routes fail closed (503-style busy message).
- **PDF preview sessions** (edit-pdf, thumbnails, html-to-pdf preview) persist metadata in Redis and PDF bytes in bucket `pdf-files` under `temp-sessions/pdf/{sessionId}.pdf` (30 min TTL). Same-instance temp files remain as a hot cache.

Optional: `GEMINI_API_KEY` (AI summarizer), `RESEND_API_KEY` (contact + password reset), `SENTRY_DSN` (error monitoring), LibreOffice/Puppeteer service URLs per deployment guide.

## Retention & privacy

- Guest uploads: auto-delete after **2 hours**
- Pro uploads: auto-delete after **24 hours**
- Usage logs: **90 days** (purged by cleanup cron)
- Admin audit logs: **90 days** (`purgeOldAdminAuditLogs` in `/api/cron/cleanup`; see `ADMIN_AUDIT_RETENTION_DAYS` in `src/lib/admin/audit-retention.ts`)
- Cookie consent stored in `consent_records` (migration 005)
- Account erasure: `DELETE /api/user/account` (authenticated)

## Docker (optional)

```bash
docker build -t onlymypdf .
docker run -p 3000:3000 --env-file .env.production onlymypdf
```

Uses Next.js `output: "standalone"` from `next.config.ts`. Node **20+** (see `.nvmrc`).

**Docker limitations:** The default image runs the Next.js app only. LibreOffice, Python (pdf2docx page render), and Puppeteer are **not** included — PDF→Word quality on Docker requires `CONVERTAPI_SECRET` or mounting a sidecar with those binaries. Rate limits and PDF→Word async jobs require `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. See `.dockerignore` for build context exclusions.

## Backup & disaster recovery

1. **Supabase**: enable daily backups (Pro plan); export schema periodically.
2. **Storage**: `pdf-files` bucket is ephemeral by design; no long-term backup required for user files.
3. **Secrets**: store in Vercel/host secret manager; rotate `CRON_SECRET` and `IP_HASH_SALT` on compromise.
4. **Recovery**: redeploy from `master`, re-run migrations 001–007 on fresh DB if needed, restore env vars, verify `/api/health` and one tool conversion.

## Incident checklist

1. Check `/api/health` and host status page.
2. Review Vercel/runtime logs and Supabase logs.
3. Confirm cron cleanup is running (stale files filling storage).
4. Verify Redis rate limits if abuse spike.
5. Roll back deployment via host dashboard if recent release correlates with outage.

## On-call contacts

Update with your team:

- Engineering: support@only4pdf.in
- Supabase project dashboard
- Razorpay merchant dashboard (payment issues)
