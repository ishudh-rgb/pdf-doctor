# PDF Doctor - Complete Deployment Guide (Beginner-Friendly)

This guide assumes you have ZERO developer experience. Follow each step carefully.

---

## Step 1: Install Required Software

### 1.1 Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS version** (recommended)
3. Run the installer, click Next through everything
4. To verify, open Command Prompt/Terminal and type:
   ```
   node --version
   npm --version
   ```
   You should see version numbers.

### 1.2 Install Git
1. Go to https://git-scm.com/downloads
2. Download and install for your OS
3. Verify: `git --version`

### 1.3 Install VS Code (optional but recommended)
1. Go to https://code.visualstudio.com
2. Download and install

---

## Step 2: Get the Project Code

If you cloned from GitHub:
```bash
git clone https://github.com/YOUR_USERNAME/pdf-doctor.git
cd pdf-doctor
```

Or if you have the folder already, open terminal in the `pdf-doctor` folder.

---

## Step 3: Install Dependencies

```bash
npm install
```

This downloads all required packages. Wait until it finishes (may take 2-5 minutes).

---

## Step 4: Set Up Supabase (Database + Auth + Storage)

### 4.1 Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest)

### 4.2 Create a New Project
1. Click "New Project"
2. Choose your organization
3. Project name: `pdf-doctor`
4. Database password: Choose a strong password (SAVE THIS!)
5. Region: Choose closest to your users (e.g., Mumbai for India)
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### 4.3 Get Your API Keys
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → This is your `SUPABASE_SERVICE_ROLE_KEY`

### 4.4 Run Database Migration
1. Go to SQL Editor in your Supabase dashboard
2. Click "New query"
3. Copy the ENTIRE content of `supabase/migrations/001_initial_schema.sql`
4. Paste it in the SQL editor
5. Click "Run"
6. You should see "Success" message

### 4.5 Set Up Storage Bucket
1. Go to Storage in Supabase dashboard
2. Click "New bucket"
3. Bucket name: `pdf-files`
4. Toggle "Public bucket" OFF (we want private)
5. Click "Create bucket"
6. Go to bucket Policies and add:
   - Allow authenticated users to upload
   - Allow authenticated users to read their own files
   - Allow service role full access

---

## Step 5: Set Up Razorpay (Payments)

### 5.1 Create Razorpay Account
1. Go to https://razorpay.com
2. Sign up for a business account
3. Complete KYC verification (may take 1-2 days)

### 5.2 Get API Keys (Test Mode First)
1. Go to Settings → API Keys
2. Click "Generate Test Key"
3. Copy:
   - **Key Id** → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

### 5.3 Set Up Webhook
1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Select events: `payment.captured`, `subscription.charged`, `subscription.cancelled`
4. Save

---

## Step 6: Set Up AI API Keys

### 6.1 Google Gemini API (Recommended - Cheaper)
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google
3. Click "Create API key"
4. Copy the key → `GEMINI_API_KEY`

### 6.2 OpenAI API (Optional)
1. Go to https://platform.openai.com
2. Sign up / Sign in
3. Go to API Keys → Create new key
4. Copy → `OPENAI_API_KEY`

---

## Step 7: Create Environment File

1. In your project folder, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   On Windows:
   ```bash
   copy .env.example .env.local
   ```

2. Open `.env.local` in a text editor and fill in ALL values:

```env
# Supabase (from Step 4)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PDF Doctor

# AI (from Step 6)
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here

# Razorpay (from Step 5)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# File Settings
MAX_FREE_FILE_SIZE_MB=25
MAX_PRO_FILE_SIZE_MB=200
FILE_RETENTION_HOURS=2

# Admin
ADMIN_EMAIL=your_email@example.com

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_string_here
```

---

## Step 8: Run Locally (Development)

```bash
npm run dev
```

Open your browser and go to: http://localhost:3000

You should see the PDF Doctor homepage!

### Troubleshooting:
- If you see errors about missing env vars, check `.env.local`
- If database errors, make sure you ran the migration SQL
- If port 3000 is busy: `npm run dev -- -p 3001`

---

## Step 9: Create Admin User

1. Go to http://localhost:3000/signup
2. Sign up with the email you set as `ADMIN_EMAIL`
3. Go to Supabase Dashboard → Table Editor → user_profiles
4. Find your user row
5. Change `role` from `user` to `admin`
6. Now you can access http://localhost:3000/admin

---

## Step 10: Test Everything

### Test Basic Tools:
1. Go to Merge PDF page
2. Upload 2 small PDF files
3. Click Merge
4. Download should work

### Test Payment (Test Mode):
1. Go to Pricing page
2. Click "Upgrade to Pro"
3. Use Razorpay test card: `4111 1111 1111 1111`
4. Any future expiry date, any CVV
5. Payment should complete and your plan should upgrade

### Test File Auto-Delete:
- Files in Supabase Storage should have `expires_at` timestamps
- After 2 hours, the cleanup job should mark them as deleted
- Manually trigger: Visit `/api/cron/cleanup?secret=your_cron_secret`

### Test AI Summarizer:
1. Log in
2. Go to AI PDF Summarizer
3. Upload a text-based PDF
4. Click Summarize
5. You should see summary results

---

## Step 11: Deploy to Production

### Option A: Deploy to Vercel (Recommended - Free Tier Available)

#### 11.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - PDF Doctor"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pdf-doctor.git
git push -u origin main
```

#### 11.2 Deploy on Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your `pdf-doctor` repository
5. Vercel auto-detects Next.js
6. Add Environment Variables:
   - Click "Environment Variables"
   - Add ALL variables from your `.env.local`
   - Make sure to add each one
7. Click "Deploy"
8. Wait 2-3 minutes
9. Your site is live! Vercel gives you a URL like `pdf-doctor.vercel.app`

#### 11.3 Set Up Custom Domain (Optional)
1. In Vercel project → Settings → Domains
2. Add your domain (e.g., pdfdoctor.com)
3. Update DNS records as shown
4. SSL is automatic

#### 11.4 Set Up Cron Job for File Cleanup
Add to `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup?secret=YOUR_CRON_SECRET",
      "schedule": "0 */1 * * *"
    }
  ]
}
```
This runs cleanup every hour. Note: Vercel cron requires Pro plan ($20/month). Alternative: use a free cron service like cron-job.org to hit your cleanup URL every hour.

### Option B: Deploy to Railway (Alternative)
1. Go to https://railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy

### Option C: Deploy to Render (Alternative)
1. Go to https://render.com
2. Connect GitHub repo
3. Create Web Service
4. Add environment variables
5. Deploy

---

## Step 12: Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] File upload works
- [ ] PDF tools process files correctly
- [ ] Login/signup works
- [ ] Payment works (switch to live Razorpay keys!)
- [ ] AI summarizer works
- [ ] Admin panel accessible
- [ ] File cleanup runs automatically
- [ ] Mobile responsive
- [ ] SEO meta tags present
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

---

## Step 13: Go Live with Razorpay

When ready for real payments:
1. Complete Razorpay KYC
2. Go to Settings → API Keys
3. Generate **Live keys** (not test)
4. Update environment variables on Vercel
5. Update webhook URL to production domain
6. Test with a small real payment

---

## Cost Estimate (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | 100GB bandwidth free | $20/mo Pro |
| Supabase | 500MB DB, 1GB storage free | $25/mo Pro |
| Gemini API | Free tier available | ~$0.001/request |
| Razorpay | 2% transaction fee | Same |
| Domain | - | ~$10/year |
| **Total (starting)** | **$0/month** | **~$45/month at scale** |

---

## Common Issues & Fixes

### "Module not found" errors
```bash
npm install
```

### Database connection errors
- Check Supabase URL and keys in `.env.local`
- Make sure project is not paused (free tier pauses after 7 days of inactivity)

### File upload fails
- Check Supabase Storage bucket exists and policies are set
- Check file size limits

### Payment not working
- Make sure you're using test keys for testing
- Check Razorpay dashboard for errors

### AI summary fails
- Check Gemini API key is valid
- Check API quota hasn't been exceeded

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Razorpay Docs: https://razorpay.com/docs
- Vercel Docs: https://vercel.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
