-- ============================================================
-- CRUSH CANCER & LIVE — UPGRADE SCHEMA v2
-- Run AFTER the initial schema (001_initial_schema.sql)
-- ============================================================

-- ============================================================
-- DROP & RECREATE EXTENDED TYPES
-- ============================================================

-- ============================================================
-- 1. REMINDERS (central reminder system)
-- ============================================================
CREATE TABLE public.reminders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN (
                      'medication','appointment','treatment','symptom_log',
                      'hydration','nutrition','follow_up','document_upload',
                      'appointment_prep','audio_session','custom'
                    )),
  title             TEXT NOT NULL,
  description       TEXT,
  due_at            TIMESTAMPTZ NOT NULL,
  recurrence        TEXT DEFAULT 'none' CHECK (recurrence IN (
                      'none','daily','twice_daily','weekly','weekdays','custom'
                    )),
  recurrence_config JSONB DEFAULT '{}'::jsonb,
  completed         BOOLEAN DEFAULT FALSE,
  completed_at      TIMESTAMPTZ,
  snoozed_until     TIMESTAMPTZ,
  snooze_count      INTEGER DEFAULT 0,
  linked_entity_id  UUID,          -- medication_id, appointment_id etc
  linked_entity_type TEXT,
  audio_id          UUID,          -- play_after_reminder: linked audio
  play_audio_after  BOOLEAN DEFAULT FALSE,
  priority          TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  colour            TEXT DEFAULT 'pink',
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. SYMPTOM PATTERNS (Side-Effect Intelligence)
-- ============================================================
CREATE TABLE public.symptom_patterns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pattern_type      TEXT NOT NULL,  -- 'post_chemo_fatigue', 'nausea_medication_link' etc
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  severity          TEXT DEFAULT 'moderate' CHECK (severity IN ('mild','moderate','significant')),
  confidence        INTEGER DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  symptom_keys      TEXT[],
  treatment_types   TEXT[],
  medication_ids    UUID[],
  data_points       INTEGER DEFAULT 0,
  first_detected    TIMESTAMPTZ DEFAULT NOW(),
  last_updated      TIMESTAMPTZ DEFAULT NOW(),
  dismissed         BOOLEAN DEFAULT FALSE,
  flagged_for_doctor BOOLEAN DEFAULT FALSE,
  raw_analysis      JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DOCTOR VISITS (enhanced from appointments)
-- ============================================================
CREATE TABLE public.doctor_visits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  visit_date          DATE NOT NULL,
  visit_time          TIME,
  doctor_name         TEXT,
  hospital            TEXT,
  specialty           TEXT,
  reason_for_visit    TEXT,
  symptoms_discussed  TEXT,
  consultation_notes  TEXT,
  test_results        TEXT,
  medication_changes  TEXT,
  treatment_recommendations TEXT,
  follow_up_actions   TEXT,
  next_appointment_date DATE,
  questions_for_next  TEXT,
  emotional_reflection TEXT,
  ai_summary          TEXT,
  ai_action_items     JSONB DEFAULT '[]'::jsonb,
  ai_questions        JSONB DEFAULT '[]'::jsonb,
  carer_notes         TEXT,
  carer_id            UUID REFERENCES public.users(id),
  companion_name      TEXT,
  pre_anxiety_level   INTEGER CHECK (pre_anxiety_level BETWEEN 1 AND 10),
  post_feeling        TEXT,
  vital_weight        TEXT,
  vital_bp            TEXT,
  vital_hr            TEXT,
  vital_temp          TEXT,
  vital_o2            TEXT,
  vital_blood_sugar   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. VISIT ACTION ITEMS
-- ============================================================
CREATE TABLE public.visit_action_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id    UUID NOT NULL REFERENCES public.doctor_visits(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  due_date    DATE,
  is_urgent   BOOLEAN DEFAULT FALSE,
  completed   BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. VISIT DOCUMENTS
-- ============================================================
CREATE TABLE public.visit_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id    UUID REFERENCES public.doctor_visits(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'other',
  file_url    TEXT NOT NULL,
  file_size   INTEGER DEFAULT 0,
  file_type   TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  notes       TEXT
);

-- ============================================================
-- 6. AUDIO LIBRARY
-- ============================================================
CREATE TABLE public.audio_library (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL CHECK (category IN (
                  'declaration','affirmation','meditation','prayer',
                  'visualisation','encouragement','treatment_day',
                  'bedtime','caregiver','scripture'
                )),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_url      TEXT NOT NULL,
  thumbnail_url TEXT,
  transcript    TEXT,
  plan_required TEXT DEFAULT 'premium',
  tags          TEXT[] DEFAULT '{}',
  is_active     BOOLEAN DEFAULT TRUE,
  play_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. AUDIO SCHEDULES
-- ============================================================
CREATE TABLE public.audio_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  audio_id      UUID NOT NULL REFERENCES public.audio_library(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL,
  days_of_week  INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Mon..7=Sun
  label         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  reminder_id   UUID REFERENCES public.reminders(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. USER AUDIO PREFERENCES
-- ============================================================
CREATE TABLE public.user_audio_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  favourites      UUID[] DEFAULT '{}',
  playlist        UUID[] DEFAULT '{}',
  play_after_reminder BOOLEAN DEFAULT TRUE,
  volume          INTEGER DEFAULT 80 CHECK (volume BETWEEN 0 AND 100),
  autoplay_next   BOOLEAN DEFAULT FALSE,
  last_played_id  UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. SHARED REPORTS (health summary exports)
-- ============================================================
CREATE TABLE public.shared_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  report_type     TEXT NOT NULL CHECK (report_type IN (
                    'appointment_briefing','symptom_report','treatment_history',
                    'side_effect_summary','full_health_summary','doctor_visit_summary'
                  )),
  date_range_from DATE,
  date_range_to   DATE,
  included_sections JSONB DEFAULT '{}'::jsonb,
  report_data     JSONB DEFAULT '{}'::jsonb,
  ai_summary      TEXT,
  share_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  token_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  is_active       BOOLEAN DEFAULT TRUE,
  view_count      INTEGER DEFAULT 0,
  last_viewed_at  TIMESTAMPTZ,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. CAREGIVER ACCESS
-- ============================================================
CREATE TABLE public.caregiver_access (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caregiver_id            UUID REFERENCES public.users(id),
  caregiver_email         TEXT,
  caregiver_name          TEXT NOT NULL,
  relationship            TEXT,
  invite_token            TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invite_accepted         BOOLEAN DEFAULT FALSE,
  invite_accepted_at      TIMESTAMPTZ,
  invite_expires_at       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  -- Permissions
  can_view_appointments   BOOLEAN DEFAULT TRUE,
  can_log_medications     BOOLEAN DEFAULT TRUE,
  can_record_visits       BOOLEAN DEFAULT TRUE,
  can_track_symptoms      BOOLEAN DEFAULT TRUE,
  can_view_documents      BOOLEAN DEFAULT FALSE,
  can_view_journal        BOOLEAN DEFAULT FALSE,
  can_prepare_summaries   BOOLEAN DEFAULT TRUE,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. WELLNESS LOGS (extended from nutrition)
-- ============================================================
CREATE TABLE public.wellness_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_at       TIMESTAMPTZ DEFAULT NOW(),
  water_ml        INTEGER DEFAULT 0,
  sleep_hours     NUMERIC(4,1),
  sleep_quality   INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  exercise_type   TEXT,
  exercise_mins   INTEGER DEFAULT 0,
  rest_mins       INTEGER DEFAULT 0,
  supplements     TEXT,
  wellness_notes  TEXT,
  energy_level    INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. APPOINTMENT BRIEFINGS (Prepare for Next Appointment)
-- ============================================================
CREATE TABLE public.appointment_briefings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id        UUID REFERENCES public.appointments(id),
  generated_at          TIMESTAMPTZ DEFAULT NOW(),
  last_visit_summary    TEXT,
  symptom_trends        JSONB DEFAULT '{}'::jsonb,
  medication_changes    JSONB DEFAULT '[]'::jsonb,
  treatment_history     TEXT,
  unresolved_concerns   TEXT,
  suggested_questions   JSONB DEFAULT '[]'::jsonb,
  key_notes             TEXT,
  ai_briefing_text      TEXT,
  pdf_url               TEXT,
  shared_with_doctor    BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS for new tables
-- ============================================================
ALTER TABLE public.reminders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_patterns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_visits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audio_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_access   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_briefings ENABLE ROW LEVEL SECURITY;

-- Own-row policies
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'reminders','symptom_patterns','doctor_visits','visit_action_items',
    'visit_documents','audio_schedules','user_audio_preferences',
    'shared_reports','wellness_logs','appointment_briefings'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "%s_own" ON public.%s FOR ALL USING (auth.uid() = user_id)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- audio_library: readable by authenticated users on right plan
ALTER TABLE public.audio_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audio_lib_read" ON public.audio_library FOR SELECT USING (is_active = TRUE);

-- caregiver policies
CREATE POLICY "caregiver_patient_view" ON public.caregiver_access
  FOR ALL USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);

-- Shared reports: view by token (anonymous-friendly read)
CREATE POLICY "shared_reports_own"   ON public.shared_reports FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "shared_reports_token" ON public.shared_reports FOR SELECT USING (
  is_active = TRUE AND token_expires_at > NOW()
);

-- Caregiver access to patient data
CREATE POLICY "caregiver_view_doctor_visits" ON public.doctor_visits FOR SELECT
  USING (user_id IN (
    SELECT patient_id FROM public.caregiver_access
    WHERE caregiver_id = auth.uid() AND is_active = TRUE AND can_record_visits = TRUE
  ));

CREATE POLICY "caregiver_insert_doctor_visits" ON public.doctor_visits FOR INSERT
  WITH CHECK (user_id IN (
    SELECT patient_id FROM public.caregiver_access
    WHERE caregiver_id = auth.uid() AND is_active = TRUE AND can_record_visits = TRUE
  ));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_reminders_user_due       ON public.reminders(user_id, due_at) WHERE is_active = TRUE;
CREATE INDEX idx_reminders_user_type      ON public.reminders(user_id, type);
CREATE INDEX idx_symptom_patterns_user    ON public.symptom_patterns(user_id, dismissed);
CREATE INDEX idx_doctor_visits_user_date  ON public.doctor_visits(user_id, visit_date);
CREATE INDEX idx_visit_actions_visit      ON public.visit_action_items(visit_id, completed);
CREATE INDEX idx_audio_schedules_user     ON public.audio_schedules(user_id, is_active);
CREATE INDEX idx_shared_reports_token     ON public.shared_reports(share_token) WHERE is_active = TRUE;
CREATE INDEX idx_caregiver_patient        ON public.caregiver_access(patient_id, is_active);
CREATE INDEX idx_caregiver_caregiver      ON public.caregiver_access(caregiver_id, is_active);

-- ============================================================
-- SEED AUDIO LIBRARY
-- ============================================================
INSERT INTO public.audio_library (title, description, category, duration_seconds, file_url, tags, plan_required) VALUES
  ('Morning Healing Declarations',      'Start your day with powerful declarations of healing and faith',              'declaration',    420, '/audio/morning-declarations.mp3',    ARRAY['morning','declarations','faith'],     'premium'),
  ('I Will Not Die But Live',           'A powerful declaration from Psalm 118 spoken over your healing',             'declaration',    180, '/audio/psalm118-declaration.mp3',     ARRAY['scripture','declaration','healing'],  'premium'),
  ('Peace Before Your Appointment',     'A calming scripture meditation to listen to before doctor visits',            'prayer',         600, '/audio/pre-appointment-peace.mp3',    ARRAY['appointment','peace','prayer'],       'premium'),
  ('Treatment Day Comfort',             'Gentle encouragement and prayer for the day you receive treatment',           'treatment_day',  900, '/audio/treatment-day.mp3',           ARRAY['treatment','chemo','comfort'],        'premium'),
  ('Bedtime Healing Meditation',        'A peaceful guided meditation to help you sleep and receive healing',          'bedtime',        1200, '/audio/bedtime-meditation.mp3',      ARRAY['sleep','bedtime','meditation'],       'premium'),
  ('I Am Healed Affirmations',          'Faith-based affirmations declaring your healing over your body',              'affirmation',    360, '/audio/healing-affirmations.mp3',    ARRAY['affirmations','healing','faith'],     'premium'),
  ('God Is With Me Meditation',         'A scripture visualisation imagining God's healing light in your body',        'visualisation',  720, '/audio/healing-visualisation.mp3',   ARRAY['visualisation','healing','peace'],    'premium'),
  ('Short Morning Encouragement',       'A 3-minute boost of hope and courage to begin your day',                      'encouragement',  180, '/audio/morning-boost.mp3',           ARRAY['morning','encouragement','short'],    'support'),
  ('Caregiver Strength &amp; Rest',     'A gentle audio session of encouragement and peace for caregivers',            'caregiver',      480, '/audio/caregiver-strength.mp3',      ARRAY['caregiver','rest','encouragement'],   'premium'),
  ('Afternoon Peace Break',             'A calming 5-minute break of prayer and stillness for the middle of the day', 'prayer',         300, '/audio/afternoon-peace.mp3',         ARRAY['afternoon','peace','break'],          'support');

-- ============================================================
-- FUNCTIONS: Reminder recurrence expansion
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_overdue_reminders(p_user_id UUID)
RETURNS TABLE (
  id UUID, title TEXT, type TEXT, due_at TIMESTAMPTZ, priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.title, r.type, r.due_at, r.priority
  FROM public.reminders r
  WHERE r.user_id = p_user_id
    AND r.is_active = TRUE
    AND r.completed = FALSE
    AND r.due_at < NOW()
    AND (r.snoozed_until IS NULL OR r.snoozed_until < NOW())
  ORDER BY r.due_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Generate default reminders for new user
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_default_reminders(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.reminders (user_id, type, title, description, due_at, recurrence, priority) VALUES
    (p_user_id, 'hydration',    'Morning Hydration',       'Start your day with a glass of water 💧',     NOW()::date + INTERVAL '8 hours',   'daily',  'normal'),
    (p_user_id, 'hydration',    'Afternoon Hydration',     'Stay hydrated — drink some water now 💧',     NOW()::date + INTERVAL '14 hours',  'daily',  'normal'),
    (p_user_id, 'symptom_log',  'Daily Symptom Check-in',  'Log how you are feeling today 📊',            NOW()::date + INTERVAL '9 hours',   'daily',  'normal'),
    (p_user_id, 'audio_session','Morning Declarations',    'Time for your morning declarations 🙏',       NOW()::date + INTERVAL '6 hours' + INTERVAL '30 minutes', 'daily', 'normal'),
    (p_user_id, 'audio_session','Bedtime Meditation',      'Wind down with your healing meditation 🌙',   NOW()::date + INTERVAL '21 hours',  'daily',  'normal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user to also create default reminders
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, stripe_customer_id, plan, status)
  VALUES (NEW.id, '', 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_audio_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.create_default_reminders(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Schema v2 upgrade complete ✅' AS result;
