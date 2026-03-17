# CRUSH CANCER & LIVE
## Complete Deployment Guide & Documentation
### Production-Ready SaaS Platform

---

## PROJECT OVERVIEW

**Crush Cancer & LIVE** is a professional health-tech SaaS application built for cancer patients and caregivers. It provides a comprehensive digital toolkit for managing the cancer journey — from treatment tracking and symptom monitoring to spiritual support and care coordination.

**Stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Supabase · Stripe · OpenAI

---

## FULL PROJECT STRUCTURE

```
crush-cancer-live/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx            # Sign in
│   │   │   ├── signup/page.tsx           # Sign up
│   │   │   ├── reset-password/page.tsx   # Password reset
│   │   │   └── callback/route.ts         # Supabase OAuth callback
│   │   ├── dashboard/page.tsx            # Main dashboard
│   │   ├── treatment/page.tsx            # Treatment planner
│   │   ├── medications/page.tsx          # Medication tracker
│   │   ├── symptoms/page.tsx             # Symptom tracker
│   │   ├── nutrition/page.tsx            # Nutrition log
│   │   ├── journal/page.tsx              # Journal & prayers
│   │   ├── care-squad/page.tsx           # Care coordination
│   │   ├── documents/page.tsx            # Document vault
│   │   ├── library/page.tsx              # Educational library
│   │   ├── ai-assistant/page.tsx         # AI assistant (Premium)
│   │   ├── settings/
│   │   │   ├── profile/page.tsx          # User profile
│   │   │   └── billing/page.tsx          # Subscription management
│   │   └── api/
│   │       ├── ai/chat/route.ts          # OpenAI chat endpoint
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts     # Stripe checkout
│   │       │   ├── portal/route.ts       # Billing portal
│   │       │   └── webhook/route.ts      # Stripe webhooks
│   │       ├── appointments/route.ts     # CRUD appointments
│   │       ├── medications/route.ts      # CRUD medications
│   │       ├── symptoms/route.ts         # CRUD symptoms
│   │       ├── journal/route.ts          # CRUD journal
│   │       ├── nutrition/route.ts        # CRUD nutrition
│   │       └── documents/route.ts        # Document management
│   ├── components/
│   │   ├── shared/
│   │   │   ├── AppShell.tsx             # Navigation wrapper
│   │   │   └── ThemeProvider.tsx         # Theme context
│   │   ├── dashboard/
│   │   │   ├── DashboardHero.tsx         # Greeting hero
│   │   │   ├── TodayAppointments.tsx     # Today's schedule
│   │   │   ├── MedicationToday.tsx       # Today's meds
│   │   │   ├── SymptomSnapshot.tsx       # Symptom summary
│   │   │   ├── TreatmentProgress.tsx     # Progress bar
│   │   │   ├── MoodCheckIn.tsx           # Daily mood
│   │   │   ├── DailyAffirmation.tsx      # Scripture/affirmation
│   │   │   ├── CareSquadWidget.tsx       # Squad overview
│   │   │   └── QuickActions.tsx          # Action buttons
│   │   ├── ui/
│   │   │   ├── Skeleton.tsx              # Loading skeletons
│   │   │   ├── Modal.tsx                 # Dialog component
│   │   │   ├── Badge.tsx                 # Status badges
│   │   │   └── ProgressBar.tsx           # Animated progress
│   │   └── [feature]/                    # Feature components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   └── server.ts                 # Server client
│   │   ├── stripe.ts                     # Stripe helpers
│   │   └── utils.ts                      # Utility functions
│   ├── hooks/
│   │   ├── useUser.ts                    # Auth user hook
│   │   ├── useSubscription.ts            # Plan hook
│   │   └── useRealtimeData.ts            # Supabase realtime
│   ├── types/
│   │   └── index.ts                      # All TypeScript types
│   └── styles/
│       └── globals.css                   # Global styles
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # Full DB schema
├── public/
│   ├── favicon.ico
│   ├── og-image.jpg
│   └── manifest.json
├── .env.example                          # Environment template
├── .env.local                            # Local secrets (git ignored)
├── middleware.ts                         # Auth + plan protection
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## STEP-BY-STEP DEPLOYMENT

### STEP 1 — SUPABASE SETUP

1. Go to **https://supabase.com** and create a new project
2. Choose a region close to your users (e.g. West Europe for UK)
3. Note your **Project URL** and **Anon Key** from Settings → API
4. Open **SQL Editor** and paste the full contents of `supabase/migrations/001_initial_schema.sql`
5. Click Run — this creates all 14 tables, RLS policies, triggers and indexes
6. Go to **Storage** → Create two buckets:
   - `documents` (private)
   - `avatars` (public)
7. In **Authentication** → Settings:
   - Enable Email/Password auth
   - Set Site URL to your domain
   - Add redirect URL: `https://yourdomain.com/auth/callback`

### STEP 2 — STRIPE SETUP

1. Go to **https://stripe.com** and create/log into your account
2. In **Products** → Create two products:

   **Product 1: Support Plan**
   - Name: Support Plan
   - Price: £19.00/month recurring
   - Copy the Price ID (starts with `price_`)

   **Product 2: Premium Healing Plan**
   - Name: Premium Healing Plan
   - Price: £49.00/month recurring
   - Copy the Price ID

3. In **Developers** → **Webhooks** → Add endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the **Webhook Signing Secret**

4. Enable **Customer Portal** in Stripe Dashboard → Billing → Customer portal

### STEP 3 — OPENAI SETUP

1. Go to **https://platform.openai.com**
2. Create an API key
3. Ensure you have access to **GPT-4o** (required for AI Assistant)
4. Set spending limits to control costs

### STEP 4 — LOCAL DEVELOPMENT

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/crush-cancer-live.git
cd crush-cancer-live

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in all values in .env.local (see template)

# Run development server
npm run dev

# Open http://localhost:3000
```

### STEP 5 — GITHUB SETUP

```bash
git init
git add .
git commit -m "feat: initial production build — Crush Cancer & LIVE"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crush-cancer-live.git
git push -u origin main
```

### STEP 6 — VERCEL DEPLOYMENT

1. Go to **https://vercel.com** → Import Project
2. Connect your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Add all environment variables from `.env.example`:

   | Variable | Where to get it |
   |----------|----------------|
   | `NEXT_PUBLIC_APP_URL` | Your Vercel domain e.g. `https://crushcancerandlive.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys |
   | `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys |
   | `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing Secret |
   | `STRIPE_SUPPORT_PRICE_ID` | Stripe → Products → Support Plan price |
   | `STRIPE_PREMIUM_PRICE_ID` | Stripe → Products → Premium Plan price |
   | `OPENAI_API_KEY` | OpenAI → API Keys |

5. Click **Deploy** → Vercel builds and deploys automatically
6. Set up your custom domain in Vercel → Settings → Domains

### STEP 7 — POST-DEPLOYMENT CHECKLIST

- [ ] Update Supabase Auth Site URL to production domain
- [ ] Update Stripe Webhook URL to production domain
- [ ] Test signup → email confirmation → dashboard
- [ ] Test Stripe checkout with test card `4242 4242 4242 4242`
- [ ] Test webhook by checking Stripe logs
- [ ] Test AI assistant with a Premium account
- [ ] Verify RLS policies by testing with different user accounts
- [ ] Enable Supabase database backups (Settings → Database → Backups)
- [ ] Set up Vercel Analytics (free tier available)

---

## DATABASE SCHEMA SUMMARY

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | id, role, plan, diagnosis, oncologist |
| `appointments` | All appointments | date, time, type, doctor, location |
| `treatment_sessions` | Chemo/radiation logs | type, session_number, drugs, side_effects |
| `medications` | Active medications | name, dosage, times[], active |
| `medication_logs` | Taken/missed logs | medication_id, taken, side_effects |
| `symptom_logs` | Daily symptoms | pain, fatigue, nausea, mood (1-10) |
| `journal_entries` | Daily journal | gratitude, prayer, affirmation, mood |
| `nutrition_logs` | Food & hydration | meal_type, food_items, water_ml |
| `documents` | File metadata | name, category, file_url, file_size |
| `care_squad_members` | Care team | patient_id, name, permissions |
| `care_tasks` | Help requests | category, title, date, claimed_by |
| `subscriptions` | Stripe subs | plan, status, stripe_customer_id |
| `ai_conversations` | Chat history | messages[], context_type |
| `notifications` | In-app alerts | type, title, message, read |

---

## SUBSCRIPTION PLAN ARCHITECTURE

### Free Plan (£0/month)
- Dashboard access
- 5 appointments/month
- 3 medications
- Basic symptom logging
- Daily journal
- Care Squad (3 members)

### Support Plan (£19/month)
- Everything in Free, plus:
- Unlimited appointments & medications
- Full symptom tracking with Recharts visualizations
- Nutrition & wellness tracker
- Document vault (2GB via UploadThing)
- Care Squad (unlimited members)
- Full treatment planner
- Educational library
- Email support (via Resend)

### Premium Healing Plan (£49/month)
- Everything in Support, plus:
- AI Health Assistant (GPT-4o powered)
- AI doctor appointment prep
- AI symptom summarizer
- Document vault (10GB)
- Caregiver mode (full access)
- Priority support
- PDF health report export
- Advanced analytics

---

## API ROUTES REFERENCE

| Route | Method | Auth | Plan | Description |
|-------|--------|------|------|-------------|
| `/api/ai/chat` | POST | ✅ | Premium | AI chat via OpenAI |
| `/api/stripe/checkout` | POST | ✅ | Any | Create Stripe session |
| `/api/stripe/portal` | POST | ✅ | Paid | Manage billing |
| `/api/stripe/webhook` | POST | — | — | Stripe webhooks |
| `/api/appointments` | GET/POST | ✅ | Any | Appointments CRUD |
| `/api/medications` | GET/POST | ✅ | Any | Medications CRUD |
| `/api/symptoms` | GET/POST | ✅ | Any | Symptom logs |
| `/api/journal` | GET/POST | ✅ | Any | Journal entries |
| `/api/nutrition` | GET/POST | ✅ | Support+ | Nutrition logs |
| `/api/documents` | GET/POST | ✅ | Support+ | Document metadata |

---

## SECURITY ARCHITECTURE

- **Row Level Security (RLS)**: Every table has RLS enabled. Users can only access their own data.
- **Caregiver access**: Limited, explicit permissions per field. Medical data hidden by default.
- **API protection**: All API routes verify Supabase session before processing.
- **Plan gating**: Middleware checks subscription plan before allowing access to premium routes.
- **Webhook verification**: Stripe webhooks verified with signing secret.
- **Security headers**: X-Frame-Options, HSTS, CSP headers set in next.config.js.
- **Data encryption**: Supabase encrypts data at rest and in transit by default.

---

## ESTIMATED COSTS (MONTHLY)

| Service | Free Tier | At 100 users | At 1000 users |
|---------|-----------|--------------|----------------|
| Vercel | Free | Free | ~$20 |
| Supabase | Free (500MB) | Free/~$25 | ~$25 |
| Stripe | 1.4% + 20p/txn | ~£3-15 | ~£30-150 |
| OpenAI GPT-4o | $0 | ~$15-50 | ~$100-300 |
| UploadThing | 2GB free | ~$10 | ~$40 |
| **Total** | **£0** | **~£25-90** | **~£200-500** |

**Revenue at 100 users (mix of plans):**
- 50 free + 30 support + 20 premium = (30×£19) + (20×£49) = £570 + £980 = **£1,550/month**

---

## MARKETING ASSETS

### APP TAGLINE
**"Empower. Heal. Thrive."**

### HEADLINE
**Crush Cancer — and LIVE.**

### VALUE PROPOSITION
*The professional digital companion for your cancer journey. Track treatment, monitor symptoms, stay spiritually strong, and coordinate your circle of care — all in one beautiful, easy-to-use app.*

### LANDING PAGE HERO COPY

```
CRUSH CANCER & LIVE

Your Cancer. Organised. Your Spirit. Unbroken.

The app that holds your entire healing journey —
appointments, treatment cycles, daily symptoms,
medications, journal, prayers, and care team —
in one calm, professional, beautifully designed space.

[Start Free — No Card Required]  [See Features]

Trusted by warriors. Built with love. 🦋
```

### FEATURE LIST (Marketing)

🗓 **Treatment Planner** — Track every chemo cycle, radiation session, and surgery with full notes

💊 **Medication Tracker** — Never miss a dose with smart reminders and side-effect logging

📊 **Symptom Tracking** — Beautiful charts to monitor pain, fatigue, mood and energy over time

🥗 **Nutrition & Wellness** — Log meals, hydration, and supplements tailored to treatment

📔 **Faith & Journal** — Gratitude, prayer, declarations, and reflections for emotional healing

🤝 **Care Squad** — Let your loved ones sign up for tasks, transport, meals, and visits

📁 **Document Vault** — Secure storage for test results, scans, and doctor letters

🤖 **AI Health Assistant** — Powered by GPT-4o — prepare for appointments, summarise symptoms, receive encouragement

📚 **Educational Library** — Treatment explanations, nutrition guidance, and wellness resources

### APP STORE DESCRIPTION

**Crush Cancer & LIVE** is the professional cancer care management app designed for patients and caregivers navigating the cancer journey.

Whether you're in active treatment or recovery, this app helps you:
• Stay organised with treatment plans and appointment tracking
• Monitor how you feel each day with visual symptom charts
• Keep your medications and reminders in one place
• Process your emotions through daily journaling and prayer
• Coordinate practical help from family and friends
• Ask your AI assistant for guidance, encouragement and doctor prep

**Designed for real people.** Large text. Simple navigation. Calming, beautiful design. Accessible for all ages.

Built with love for warriors, survivors, and the people who love them. 🦋

*Free to start. Support Plan from £19/month. Premium with AI from £49/month.*

### SOCIAL MEDIA COPY

**Instagram/Facebook post:**
> You are not your diagnosis. You are a warrior, a survivor, and a testimony in progress. 💛
> Crush Cancer & LIVE gives you the tools to organise your journey, stay spiritually strong, and let the people who love you show up properly.
> Try it free today. 🦋 #CrushCancerAndLive #CancerWarrior #YouveGotThis

**Twitter/X:**
> Cancer is hard enough. Managing it shouldn't be.
> Crush Cancer & LIVE — track treatment, log symptoms, journal your faith, coordinate your care squad. All in one beautiful app.
> Free to start 🦋

---

## SUPPORT & NEXT STEPS

### IMMEDIATE PRIORITIES AFTER LAUNCH

1. **Onboarding flow** — Multi-step wizard after signup to collect diagnosis details
2. **Push notifications** — Medication reminders via Vercel Cron + Resend
3. **Mobile PWA** — Add service worker for offline symptom logging
4. **PDF export** — Health summary reports for doctor appointments
5. **Caregiver linking** — Full caregiver invitation and access flow
6. **Telehealth integration** — Video call links embedded in appointment cards

### GDPR COMPLIANCE CHECKLIST

- [ ] Privacy policy page (`/privacy`)
- [ ] Terms of service page (`/terms`)
- [ ] Cookie consent banner
- [ ] Data export endpoint (`/api/user/export`)
- [ ] Account deletion endpoint (`/api/user/delete`)
- [ ] Data Processing Agreement with Supabase
- [ ] Data Processing Agreement with Stripe

### TECHNICAL SUPPORT CONTACTS

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs

---

*Crush Cancer & LIVE — Empower · Heal · Thrive*
*Built with love for every warrior on this journey 🦋*
