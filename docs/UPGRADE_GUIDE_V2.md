# CRUSH CANCER & LIVE — Upgrade Guide v2
## Complete Feature Upgrade Documentation

---

## WHAT'S NEW IN v2

### New Pages Added
| Page | Route | Plan |
|------|-------|------|
| Reminder Dashboard | `/reminders` | Support+ |
| Doctor Visit Recorder | `/doctor-visits` | Support+ |
| Prepare for Appointment | `/prepare-appointment` | Premium |
| Side-Effect Intelligence | `/side-effects` | Premium |
| Guided Audio Library | `/audio` | Premium |
| Share Health Summary | `/share-health` | Support+ |

### New API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/reminders` | GET/POST/PATCH/DELETE | Full reminder CRUD |
| `/api/doctor-visits` | GET/POST | Doctor visits + AI summary |
| `/api/prepare-appointment` | POST | AI briefing generation |
| `/api/side-effects/analyse` | POST | AI pattern analysis |
| `/api/share-health` | GET/POST | Secure report sharing |
| `/api/cron/reminders` | GET | Reminder email cron |
| `/api/audio` | GET | Audio library |

### New Database Tables (run 002_upgrade_schema.sql)
- `reminders` — central reminder system with recurrence
- `symptom_patterns` — AI-identified patterns
- `doctor_visits` — comprehensive visit records
- `visit_action_items` — post-visit action tracking
- `visit_documents` — visit document uploads
- `audio_library` — seeded audio content
- `audio_schedules` — per-user scheduled sessions
- `user_audio_preferences` — favourites, playlists, volume
- `shared_reports` — secure shareable health reports
- `caregiver_access` — detailed permission system
- `wellness_logs` — sleep, exercise, hydration
- `appointment_briefings` — AI-generated briefings

---

## UPGRADE STEPS

### Step 1 — Run database migration
```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/002_upgrade_schema.sql
```

### Step 2 — Add new environment variables
```env
# Add to .env.local
CRON_SECRET=your-random-secret-for-cron-auth
```

### Step 3 — Update AppShell navigation
In `src/components/shared/AppShell.tsx`, replace the `NAV_ITEMS` array
with `NAV_ITEMS_V2` from `src/components/shared/NavConfig.ts`.

Import the new Lucide icons needed:
```tsx
import { Bell, Stethoscope, ClipboardCheck, Brain, Music, Share2, Sparkles } from 'lucide-react'
```

### Step 4 — Update middleware
In `middleware.ts`, update route arrays:
```typescript
const PREMIUM_ROUTES = [
  '/ai-assistant', '/side-effects', '/prepare-appointment', '/audio',
]
const SUPPORT_ROUTES = [
  '/documents', '/library', '/share-health', '/doctor-visits', '/reminders',
]
```

### Step 5 — Update Stripe plans
In Stripe Dashboard, verify your existing prices are correct.
The premium plan at £49/month now unlocks:
- AI Visit Summaries
- Side-Effect Intelligence  
- Prepare for Appointment
- Guided Audio Library
- Share Health Summary

### Step 6 — Upload audio files
Upload audio files to Supabase Storage bucket `audio`:
- `/audio/morning-declarations.mp3`
- `/audio/psalm118-declaration.mp3`
- `/audio/pre-appointment-peace.mp3`
- `/audio/treatment-day.mp3`
- `/audio/bedtime-meditation.mp3`
- `/audio/healing-affirmations.mp3`
- `/audio/healing-visualisation.mp3`
- `/audio/morning-boost.mp3`
- `/audio/caregiver-strength.mp3`
- `/audio/afternoon-peace.mp3`

Update `file_url` in the `audio_library` table to match your Storage URLs.

### Step 7 — Deploy to Vercel
```bash
git add .
git commit -m "feat: v2 upgrade — reminders, audio, side-effect intelligence, doctor visits"
git push origin main
```

Vercel auto-deploys. Add `CRON_SECRET` to Vercel environment variables.

---

## FEATURE ARCHITECTURE

### Reminder System
```
User creates reminder → Saved to DB
↓
Vercel Cron (every 15 min) → Checks due reminders
↓
Send email via Resend + Create in-app notification
↓
If recurring → Create next occurrence automatically
↓
If play_audio_after → Trigger audio session on app
```

### Side-Effect Intelligence
```
User clicks "Run Analysis"
↓
Fetch last 60 days: symptom_logs + treatment_sessions + medications
↓
Build compact data summary
↓
Send to OpenAI GPT-4o with strict prompt (no medical advice)
↓
Parse JSON response → Save to symptom_patterns table
↓
Display pattern cards with charts
↓
User can flag patterns for doctor → Appears in appointment briefing
```

### Prepare for Appointment
```
User clicks "Generate Briefing"
↓
Fetch: last doctor visit + recent symptoms + medications + treatments + patterns
↓
Calculate average symptom scores (30 days)
↓
Send to OpenAI with appointment prep prompt
↓
Parse: summary + questions + concerns + briefing text
↓
Save to appointment_briefings table
↓
User can share via secure link, print, or export PDF
```

### Audio Scheduling
```
User creates schedule (time + days + audio track)
↓
Saved to audio_schedules table
↓
Vercel Cron (every hour) checks upcoming sessions
↓
Creates reminder 30 min before session time
↓
User receives notification
↓
Opens app → Audio player auto-starts correct track
```

### Share Health Summary
```
User creates report → Selects type + sections + date range
↓
Server gathers data from relevant tables
↓
Saves to shared_reports with unique share_token
↓
User copies/emails secure link
↓
Doctor opens link → View-only report rendered
↓
View count tracked, link auto-expires in 30 days
↓
User can revoke at any time
```

---

## SECURITY NOTES

1. **RLS on all new tables** — users only access their own data
2. **Caregiver permissions** — granular per-section access control
3. **Cron authentication** — CRON_SECRET env var required
4. **Share tokens** — cryptographically random 48-char hex tokens
5. **Token expiry** — all shared reports expire in 30 days
6. **AI prompts** — hardcoded disclaimer in every AI call
7. **Plan gating** — middleware + API routes both check subscription

---

## MEDICAL DISCLAIMER (display on all AI pages)

> This application is an organisational and support tool. It does not diagnose disease,
> prescribe treatment, or provide medical advice. All AI-generated content summarises
> and organises your own logged data only. Always follow your medical team's guidance.

---

*Crush Cancer & LIVE v2 — Empower · Heal · Thrive 🦋*
