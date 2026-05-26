# PDF Doctor

**Every PDF tool you need, in one simple place.**

PDF Doctor is a modern, production-ready SaaS PDF toolkit website. Merge, split, compress, convert, scan, sign, protect, unlock, and summarize PDFs — all from your browser.

## Features

### 12 PDF Tools
- **Merge PDF** — Combine multiple PDFs into one
- **Split PDF** — Split PDF into separate pages
- **Compress PDF** — Reduce PDF file size
- **PDF to Word** — Convert PDF to editable Word document
- **Word to PDF** — Convert Word documents to PDF
- **JPG to PDF** — Convert images to PDF
- **Edit PDF** — Add text, images, and annotations
- **Sign PDF** — Add your signature to any PDF
- **AI PDF Summarizer** — Get AI-powered summary with key points
- **PDF Scanner** — Scan documents using your camera
- **Unlock PDF** — Remove password from PDFs you own
- **Protect PDF** — Add password protection to PDFs

### Business Features
- Free and Pro subscription plans
- Razorpay payment integration (UPI, Cards, Net Banking)
- Google AdSense ad placements (free users)
- Admin dashboard with analytics
- User management and role-based access
- Usage tracking and limits
- File auto-deletion after 2 hours

### Technical Features
- Server-side PDF processing
- AI summarization (Gemini API / OpenAI API)
- English + Hindi language support
- SEO-optimized pages
- Mobile responsive design
- Secure file handling
- Rate limiting and validation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| PDF Processing | pdf-lib, pdf-parse |
| AI | Google Gemini API |
| Payments | Razorpay |
| Deployment | Vercel |

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm installed
- Supabase account
- Razorpay account (for payments)
- Gemini API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pdf-doctor.git
cd pdf-doctor

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migration
# (Copy supabase/migrations/001_initial_schema.sql to Supabase SQL Editor and run)

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Environment Variables

See `.env.example` for all required variables. You need:
- Supabase URL and keys
- Razorpay API keys
- Gemini API key
- Admin email

## Detailed Setup

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete step-by-step instructions including:
- Software installation
- Supabase setup
- Razorpay setup
- AI API setup
- Local development
- Production deployment
- Testing checklist

## Project Structure

```
pdf-doctor/
├── src/
│   ├── app/                  # Pages and API routes
│   │   ├── (auth)/           # Login, Signup
│   │   ├── (tools)/          # All 12 tool pages
│   │   ├── admin/            # Admin panel
│   │   ├── dashboard/        # User dashboard
│   │   ├── api/              # Backend API
│   │   └── ...               # Other pages
│   ├── components/           # Reusable components
│   ├── lib/                  # Services, utilities, database
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # Translations (EN, HI)
│   ├── types/                # TypeScript types
│   └── config/               # App configuration
├── supabase/                 # Database migrations
├── public/                   # Static assets
└── ...
```

## License

Proprietary — All rights reserved.
