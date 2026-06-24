# OnlyMyPDF — Operations Runbook

Production operations guide for monitoring, deployments, backups, and incident response. Conversion pipelines (LibreOffice, Puppeteer, pdf-lib services) are unchanged by this document.

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness: app + env sanity (returns `200` JSON) |
| Vercel/host dashboard | Process uptime, memory, cold starts |

**Probe example**

```bash
curl -fsS https://yourdomain.com/api/health
```

Expected fields: `status`, `timestamp`, `version` (when configured).

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main` or `master`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test` (Vitest unit tests)
5. `npm audit --audit-level=high` (non-blocking)
6. `npm run build`

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
| File cleanup + consent purge (3yr) | `GET /api/cron/cleanup` | `Authorization: Bearer $CRON_SECRET`, `?secret=`, or Vercel `x-vercel-cron` |

Configure in Vercel Cron or external scheduler. Never expose `CRON_SECRET` in client code.

## Database migrations

Run in order in Supabase SQL Editor (or `supabase db push`):

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Core tables, storage |
| `002_security_hardening.sql` | RLS policies |
| `003_security_rls_payments.sql` | Payment tables RLS |
| `004_security_rls_admin_tables.sql` | Admin RLS |
| `005_scalability_privacy.sql` | Indexes, `consent_records`, retention helpers |

After each migration, verify in Table Editor and run a smoke test (upload → convert → download).

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

Recommended for scale:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Optional: `GEMINI_API_KEY` (AI summarizer), `RESEND_API_KEY` (contact + password reset), `SENTRY_DSN` (error monitoring), LibreOffice/Puppeteer service URLs per deployment guide.

## Retention & privacy

- Guest uploads: auto-delete after **2 hours**
- Pro uploads: auto-delete after **24 hours**
- Cookie consent stored in `consent_records` (migration 005)
- Account erasure: `DELETE /api/user/account` (authenticated)

## Docker (optional)

```bash
docker build -t onlymypdf .
docker run -p 3000:3000 --env-file .env.production onlymypdf
```

Uses Next.js `output: "standalone"` from `next.config.ts`. Node **20+** (see `.nvmrc`).

## Backup & disaster recovery

1. **Supabase**: enable daily backups (Pro plan); export schema periodically.
2. **Storage**: `pdf-files` bucket is ephemeral by design; no long-term backup required for user files.
3. **Secrets**: store in Vercel/host secret manager; rotate `CRON_SECRET` and `IP_HASH_SALT` on compromise.
4. **Recovery**: redeploy from `master`, re-run migrations 001–005 on fresh DB if needed, restore env vars, verify `/api/health` and one tool conversion.

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
