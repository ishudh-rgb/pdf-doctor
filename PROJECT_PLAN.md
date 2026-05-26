# PDF Doctor - Complete Project Plan

## 1. Architecture Overview

```
pdf-doctor/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (tools)/            # Tool pages (merge-pdf, split-pdf, etc.)
│   │   ├── admin/              # Admin panel
│   │   ├── dashboard/          # User dashboard
│   │   ├── pricing/            # Pricing page
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Auth endpoints
│   │   │   ├── tools/          # Tool processing endpoints
│   │   │   ├── files/          # File upload/download endpoints
│   │   │   ├── payments/       # Razorpay endpoints
│   │   │   ├── admin/          # Admin API endpoints
│   │   │   └── ai/             # AI summary endpoints
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   ├── contact/            # Contact page
│   │   ├── faq/                # FAQ page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI (buttons, cards, modals)
│   │   ├── layout/             # Header, footer, sidebar
│   │   ├── tools/              # Tool-specific components
│   │   ├── upload/             # Upload components
│   │   ├── ads/                # Ad placement components
│   │   └── admin/              # Admin components
│   ├── lib/                    # Utilities and services
│   │   ├── services/           # Backend services
│   │   ├── db/                 # Database queries
│   │   ├── ai/                 # AI provider adapters
│   │   ├── payment/            # Payment integration
│   │   ├── storage/            # File storage
│   │   └── utils/              # Helper functions
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Internationalization
│   │   ├── en.json             # English translations
│   │   └── hi.json             # Hindi translations
│   ├── types/                  # TypeScript types
│   └── config/                 # App configuration
├── supabase/
│   └── migrations/             # Database migrations
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
└── package.json
```

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | SEO, SSR, API routes, beginner-friendly |
| Styling | Tailwind CSS | Fast, utility-first, responsive |
| UI | Custom components + shadcn/ui | Clean, accessible, customizable |
| Database | Supabase (PostgreSQL) | Free tier, auth built-in, storage |
| Auth | Supabase Auth | Easy setup, social login support |
| Storage | Supabase Storage | Integrated with auth, free tier |
| PDF Processing | pdf-lib (JS), pdf-parse | Free, runs in Node.js |
| AI | Gemini API (default), OpenAI (optional) | Cheap, switchable via adapter |
| Payments | Razorpay | India-focused, UPI, cards, net banking |
| Ads | Google AdSense | Industry standard |
| Deployment | Vercel (frontend) | Free tier, easy for beginners |

## 3. Database Schema

See `supabase/migrations/` for full SQL.

### Tables:
- **users** - Supabase auth handles this
- **user_profiles** - Extended user data, plan info
- **plans** - Plan definitions (free, pro)
- **subscriptions** - Active subscriptions
- **payments** - Payment records
- **tool_jobs** - Processing job records
- **uploaded_files** - File metadata
- **usage_logs** - Usage tracking
- **ai_usage_logs** - AI-specific usage
- **admin_settings** - Configurable settings
- **coupon_codes** - Discount coupons
- **error_logs** - Error tracking

## 4. API Endpoints

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/session

### Tools
- POST /api/tools/merge-pdf
- POST /api/tools/split-pdf
- POST /api/tools/compress-pdf
- POST /api/tools/pdf-to-word
- POST /api/tools/word-to-pdf
- POST /api/tools/jpg-to-pdf
- POST /api/tools/edit-pdf
- POST /api/tools/sign-pdf
- POST /api/tools/unlock-pdf
- POST /api/tools/protect-pdf

### Files
- POST /api/files/upload
- GET /api/files/download/:id
- DELETE /api/files/:id
- GET /api/files/job/:jobId

### AI
- POST /api/ai/summarize

### Payments
- POST /api/payments/create-order
- POST /api/payments/verify
- GET /api/payments/status
- POST /api/payments/webhook

### Admin
- GET /api/admin/dashboard
- GET /api/admin/users
- PATCH /api/admin/users/:id
- GET /api/admin/settings
- PATCH /api/admin/settings
- GET /api/admin/analytics
- GET /api/admin/jobs
- GET /api/admin/coupons
- POST /api/admin/coupons

## 5. Security Plan
- File type validation (magic bytes + extension)
- File size limits enforced server-side
- Rate limiting on all API endpoints
- Secure random filenames (UUID)
- Auto-delete files after 2 hours (cron job)
- CSRF protection via Next.js
- Input sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping + CSP headers)

## 6. Payment Flow
1. User clicks "Upgrade to Pro"
2. Frontend calls POST /api/payments/create-order
3. Backend creates Razorpay order
4. Frontend opens Razorpay checkout
5. User pays via UPI/Card/Net Banking
6. Razorpay redirects with payment info
7. Frontend calls POST /api/payments/verify
8. Backend verifies signature
9. Backend upgrades user plan
10. Webhook handles async confirmation

## 7. Deployment Steps
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Create Supabase project
5. Run database migrations
6. Configure storage buckets
7. Set up Razorpay account
8. Get Gemini API key
9. Deploy and test
