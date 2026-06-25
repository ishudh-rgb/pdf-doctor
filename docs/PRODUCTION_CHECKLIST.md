# OnlyMyPDF — Production Environment Checklist

Copy this checklist when deploying to Vercel, Docker, or any host. **Conversion pipelines are unchanged** — these variables enable ops, contact, monitoring, and scale.

## Required (app will not start safely without these in production)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (e.g. `https://onlymypdf.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB/storage (never expose to client) |
| `CRON_SECRET` | Authorizes `/api/cron/cleanup` |
| `IP_HASH_SALT` | Hashes guest IPs for rate limits / logs |
| `RAZORPAY_KEY_ID` | Payment order creation |
| `RAZORPAY_KEY_SECRET` | Payment verification |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC validation |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client checkout (same as key ID) |

## Strongly recommended

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Distributed rate limiting across instances |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth token |
| `RESEND_API_KEY` | Contact form + password reset emails |
| `EMAIL_FROM` | From address (e.g. `OnlyMyPDF <noreply@onlymypdf.com>`) |
| `CONTACT_INBOX_EMAIL` | Inbox for `/api/contact` (default: `support@onlymypdf.in`) |
| `SENTRY_DSN` | Error monitoring (optional but recommended) |

## Optional features

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | AI PDF summarizer (full AI mode) |
| `OPENAI_API_KEY` | Alternate AI provider if configured |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Drive picker on tool pages |
| `NEXT_PUBLIC_DROPBOX_APP_KEY` | Dropbox picker |
| `CONVERTAPI_SECRET` | External PDF→Word API |
| `PDF2DOCX_PYTHON` | Path to Python for pdf2docx |

## GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `PRODUCTION_URL` | Post-deploy smoke test target (e.g. `https://onlymypdf.com`) |
| `CRON_SECRET` | Optional: authenticated detailed health check in deploy-smoke |

## Database (run once per environment)

Execute in order in Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_security_hardening.sql`
3. `supabase/migrations/003_security_rls_payments.sql`
4. `supabase/migrations/004_security_rls_admin_tables.sql`
5. `supabase/migrations/005_scalability_privacy.sql`
6. `supabase/migrations/006_payment_retention_on_delete.sql`

Configure **Storage** bucket `pdf-files` as **private** (see `DEPLOYMENT_GUIDE.md`).

## Post-deploy verification

```bash
curl -fsS https://yourdomain.com/api/health
curl -fsS https://yourdomain.com/robots.txt
curl -fsS https://yourdomain.com/sitemap.xml
```

Manual checks:

- [ ] Contact form sends email (requires `RESEND_API_KEY`)
- [ ] Cookie banner → dashboard settings syncs to server
- [ ] Cron cleanup runs hourly (Vercel cron + `CRON_SECRET`)
- [ ] Upload → convert → download on one tool (smoke test)

## Branding

Set `NEXT_PUBLIC_APP_NAME=OnlyMyPDF` to match SEO/canonical branding.

See also: `docs/OPERATIONS.md`, `DEPLOYMENT_GUIDE.md`, `.env.example`.
