-- ============================================================
-- CRUSH CANCER & LIVE — Complete Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                    TEXT NOT NULL,
  full_name                TEXT NOT NULL DEFAULT '',
  avatar_url               TEXT,
  role                     TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient','caregiver')),
  plan                     TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','support','premium')),
  patient_id               UUID REFERENCES public.users(id),
  diagnosis                TEXT,
  diagnosis_date           DATE,
  oncologist               TEXT,
  hospital                 TEXT,
  nhs_number               TEXT,
  blood_type               TEXT,
  allergies                TEXT,
  emergency_contact_name   TEXT,
  emergency_contact_phone  TEXT,
  timezone                 TEXT DEFAULT 'Europe/London',
  notifications_enabled    BOOLEAN DEFAULT TRUE,
  onboarding_completed     BOOLEAN DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. APPOINTMENTS
-- ============================================================
CREATE TABLE public.appointments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'consultation',
  date                DATE NOT NULL,
  time                TIME NOT NULL,
  duration_minutes    INTEGER DEFAULT 60,
  location            TEXT DEFAULT '',
  doctor              TEXT DEFAULT '',
  notes               TEXT,
  transport_needed    BOOLEAN DEFAULT FALSE,
  companion_needed    BOOLEAN DEFAULT FALSE,
  completed           BOOLEAN DEFAULT FALSE,
  reminder_sent       BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TREATMENT SESSIONS
-- ============================================================
CREATE TABLE public.treatment_sessions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type                    TEXT NOT NULL,
  session_number          INTEGER NOT NULL DEFAULT 1,
  total_sessions          INTEGER,
  date                    DATE NOT NULL,
  duration_minutes        INTEGER,
  drugs_given             TEXT[],
  location                TEXT DEFAULT '',
  doctor                  TEXT DEFAULT '',
  pre_treatment_notes     TEXT,
  post_treatment_notes    TEXT,
  side_effects            TEXT[],
  overall_feeling         INTEGER DEFAULT 5 CHECK (overall_feeling BETWEEN 1 AND 10),
  completed               BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. MEDICATIONS
-- ============================================================
CREATE TABLE public.medications (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  dosage                  TEXT NOT NULL,
  frequency               TEXT NOT NULL,
  times                   TEXT[] NOT NULL DEFAULT '{}',
  start_date              DATE NOT NULL,
  end_date                DATE,
  prescribed_by           TEXT,
  purpose                 TEXT,
  side_effects_to_watch   TEXT,
  notes                   TEXT,
  active                  BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.medication_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id       UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  taken_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  taken               BOOLEAN NOT NULL DEFAULT TRUE,
  side_effects_noted  TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. SYMPTOM LOGS
-- ============================================================
CREATE TABLE public.symptom_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pain_level          INTEGER DEFAULT 1 CHECK (pain_level BETWEEN 1 AND 10),
  fatigue_level       INTEGER DEFAULT 1 CHECK (fatigue_level BETWEEN 1 AND 10),
  nausea_level        INTEGER DEFAULT 1 CHECK (nausea_level BETWEEN 1 AND 10),
  appetite_level      INTEGER DEFAULT 5 CHECK (appetite_level BETWEEN 1 AND 10),
  sleep_quality       INTEGER DEFAULT 5 CHECK (sleep_quality BETWEEN 1 AND 10),
  mood                INTEGER DEFAULT 3 CHECK (mood BETWEEN 1 AND 5),
  anxiety_level       INTEGER DEFAULT 1 CHECK (anxiety_level BETWEEN 1 AND 10),
  energy_level        INTEGER DEFAULT 5 CHECK (energy_level BETWEEN 1 AND 10),
  notes               TEXT,
  flagged_for_doctor  BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. JOURNAL ENTRIES
-- ============================================================
CREATE TABLE public.journal_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  title           TEXT,
  reflection      TEXT,
  gratitude_1     TEXT,
  gratitude_2     TEXT,
  gratitude_3     TEXT,
  prayer          TEXT,
  affirmation     TEXT,
  small_win       TEXT,
  mood            INTEGER DEFAULT 3 CHECK (mood BETWEEN 1 AND 5),
  energy_level    INTEGER DEFAULT 5 CHECK (energy_level BETWEEN 1 AND 10),
  faith_level     INTEGER DEFAULT 5 CHECK (faith_level BETWEEN 1 AND 10),
  is_private      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- ============================================================
-- 7. NUTRITION LOGS
-- ============================================================
CREATE TABLE public.nutrition_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack','supplement')),
  food_items      TEXT NOT NULL,
  water_ml        INTEGER DEFAULT 0,
  appetite_score  INTEGER DEFAULT 5 CHECK (appetite_score BETWEEN 1 AND 10),
  nausea_after    BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. DOCUMENTS (file metadata — files stored in Supabase Storage)
-- ============================================================
CREATE TABLE public.documents (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                        TEXT NOT NULL,
  category                    TEXT NOT NULL DEFAULT 'other',
  file_url                    TEXT NOT NULL,
  file_size                   INTEGER NOT NULL DEFAULT 0,
  file_type                   TEXT NOT NULL,
  date                        DATE,
  doctor                      TEXT,
  notes                       TEXT,
  is_shared_with_caregiver    BOOLEAN DEFAULT FALSE,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. CARE SQUAD MEMBERS
-- ============================================================
CREATE TABLE public.care_squad_members (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_id            UUID REFERENCES public.users(id),
  name                    TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  relationship            TEXT NOT NULL,
  can_view_medical        BOOLEAN DEFAULT FALSE,
  can_view_appointments   BOOLEAN DEFAULT TRUE,
  can_view_medications    BOOLEAN DEFAULT FALSE,
  joined_at               TIMESTAMPTZ,
  invite_token            TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invite_expires_at       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.care_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category        TEXT NOT NULL DEFAULT 'other',
  title           TEXT NOT NULL,
  description     TEXT,
  date            DATE,
  time            TIME,
  is_urgent       BOOLEAN DEFAULT FALSE,
  claimed_by_id   UUID REFERENCES public.users(id),
  claimed_by_name TEXT,
  claimed_at      TIMESTAMPTZ,
  completed       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL,
  stripe_subscription_id  TEXT,
  plan                    TEXT NOT NULL DEFAULT 'free',
  status                  TEXT NOT NULL DEFAULT 'active',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 11. AI CONVERSATIONS
-- ============================================================
CREATE TABLE public.ai_conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_type    TEXT DEFAULT 'general',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- Users: own row
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);

-- Caregivers can view patient data if linked
CREATE POLICY "caregiver_view_patient" ON public.users FOR SELECT
  USING (id IN (
    SELECT patient_id FROM public.users WHERE id = auth.uid() AND role = 'caregiver'
  ));

-- Standard own-row policies for all user-data tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'appointments','treatment_sessions','medications','medication_logs',
    'symptom_logs','journal_entries','nutrition_logs','documents',
    'subscriptions','ai_conversations','notifications'
  ] LOOP
    EXECUTE format('CREATE POLICY "%s_own" ON public.%s FOR ALL USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- Care squad: patient owns, caregivers can read
CREATE POLICY "care_squad_patient" ON public.care_squad_members FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "care_squad_read_invite" ON public.care_squad_members FOR SELECT USING (
  caregiver_id = auth.uid() OR invite_token IS NOT NULL
);
CREATE POLICY "care_tasks_patient" ON public.care_tasks FOR ALL USING (auth.uid() = patient_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.subscriptions (user_id, stripe_customer_id, plan, status)
  VALUES (NEW.id, '', 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','appointments','medications','journal_entries','subscriptions','ai_conversations'] LOOP
    EXECUTE format('CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_appointments_user_date   ON public.appointments(user_id, date);
CREATE INDEX idx_medications_user_active  ON public.medications(user_id, active);
CREATE INDEX idx_medication_logs_med_date ON public.medication_logs(medication_id, taken_at);
CREATE INDEX idx_symptom_logs_user_date   ON public.symptom_logs(user_id, logged_at);
CREATE INDEX idx_journal_entries_user     ON public.journal_entries(user_id, entry_date);
CREATE INDEX idx_nutrition_logs_user      ON public.nutrition_logs(user_id, logged_at);
CREATE INDEX idx_documents_user_cat       ON public.documents(user_id, category);
CREATE INDEX idx_care_tasks_patient       ON public.care_tasks(patient_id, completed);
CREATE INDEX idx_notifications_user_read  ON public.notifications(user_id, read);

-- ============================================================
-- STORAGE BUCKETS (run after creating buckets in Supabase UI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies (uncomment after creating buckets)
-- CREATE POLICY "doc_upload_own" ON storage.objects FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "doc_view_own" ON storage.objects FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "doc_delete_own" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED: Educational content categories
-- ============================================================
CREATE TABLE public.library_articles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category    TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  author      TEXT,
  tags        TEXT[],
  plan_required TEXT DEFAULT 'free',
  published   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.library_articles (category, title, content, author, tags) VALUES
  ('treatment', 'Understanding Chemotherapy', 'Chemotherapy uses drugs to destroy cancer cells...', 'Medical Team', ARRAY['chemo','treatment','basics']),
  ('treatment', 'What to Expect from Radiation Therapy', 'Radiation therapy uses high-energy rays...', 'Medical Team', ARRAY['radiation','treatment','basics']),
  ('nutrition', 'Eating Well During Chemotherapy', 'Good nutrition is essential during cancer treatment...', 'Nutrition Team', ARRAY['nutrition','chemo','wellness']),
  ('wellness', 'Managing Fatigue During Treatment', 'Cancer-related fatigue is one of the most common side effects...', 'Wellness Team', ARRAY['fatigue','wellness','tips']),
  ('spiritual', 'Finding Peace in the Storm', 'Your spiritual and emotional wellbeing matters deeply...', 'Pastoral Care', ARRAY['faith','peace','spiritual']),
  ('support', 'How to Talk to Your Family About Cancer', 'Communicating about your diagnosis can feel overwhelming...', 'Support Team', ARRAY['family','communication','support']);

SELECT 'Schema created successfully! 🎉' AS result;
