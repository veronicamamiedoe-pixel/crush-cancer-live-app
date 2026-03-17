// ============================================================
// CRUSH CANCER & LIVE — Extended Types v2
// Append to existing src/types/index.ts
// ============================================================

// ---- REMINDER ----
export type ReminderType =
  | 'medication' | 'appointment' | 'treatment' | 'symptom_log'
  | 'hydration'  | 'nutrition'   | 'follow_up' | 'document_upload'
  | 'appointment_prep' | 'audio_session' | 'custom'

export type ReminderRecurrence = 'none' | 'daily' | 'twice_daily' | 'weekly' | 'weekdays' | 'custom'

export interface Reminder {
  id: string
  user_id: string
  type: ReminderType
  title: string
  description?: string
  due_at: string
  recurrence: ReminderRecurrence
  recurrence_config?: Record<string, unknown>
  completed: boolean
  completed_at?: string
  snoozed_until?: string
  snooze_count: number
  linked_entity_id?: string
  linked_entity_type?: string
  audio_id?: string
  play_audio_after: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  colour: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---- SYMPTOM PATTERN ----
export interface SymptomPattern {
  id: string
  user_id: string
  pattern_type: string
  title: string
  description: string
  severity: 'mild' | 'moderate' | 'significant'
  confidence: number
  symptom_keys: string[]
  treatment_types: string[]
  medication_ids: string[]
  data_points: number
  first_detected: string
  last_updated: string
  dismissed: boolean
  flagged_for_doctor: boolean
  raw_analysis: Record<string, unknown>
  created_at: string
}

// ---- DOCTOR VISIT ----
export interface DoctorVisit {
  id: string
  user_id: string
  title: string
  visit_date: string
  visit_time?: string
  doctor_name?: string
  hospital?: string
  specialty?: string
  reason_for_visit?: string
  symptoms_discussed?: string
  consultation_notes?: string
  test_results?: string
  medication_changes?: string
  treatment_recommendations?: string
  follow_up_actions?: string
  next_appointment_date?: string
  questions_for_next?: string
  emotional_reflection?: string
  ai_summary?: string
  ai_action_items: ActionItem[]
  ai_questions: string[]
  carer_notes?: string
  carer_id?: string
  companion_name?: string
  pre_anxiety_level?: number
  post_feeling?: string
  vital_weight?: string
  vital_bp?: string
  vital_hr?: string
  vital_temp?: string
  vital_o2?: string
  vital_blood_sugar?: string
  created_at: string
  updated_at: string
}

export interface ActionItem {
  id?: string
  title: string
  due_date?: string
  is_urgent: boolean
  completed: boolean
}

// ---- AUDIO ----
export type AudioCategory =
  | 'declaration' | 'affirmation' | 'meditation' | 'prayer'
  | 'visualisation' | 'encouragement' | 'treatment_day'
  | 'bedtime' | 'caregiver' | 'scripture'

export interface AudioTrack {
  id: string
  title: string
  description?: string
  category: AudioCategory
  duration_seconds: number
  file_url: string
  thumbnail_url?: string
  transcript?: string
  plan_required: string
  tags: string[]
  is_active: boolean
  play_count: number
  created_at: string
}

export interface AudioSchedule {
  id: string
  user_id: string
  audio_id: string
  scheduled_time: string
  days_of_week: number[]
  label?: string
  is_active: boolean
  reminder_id?: string
  created_at: string
  audio?: AudioTrack
}

export interface UserAudioPreferences {
  id: string
  user_id: string
  favourites: string[]
  playlist: string[]
  play_after_reminder: boolean
  volume: number
  autoplay_next: boolean
  last_played_id?: string
}

// ---- SHARED REPORT ----
export type ReportType =
  | 'appointment_briefing' | 'symptom_report' | 'treatment_history'
  | 'side_effect_summary'  | 'full_health_summary' | 'doctor_visit_summary'

export interface SharedReport {
  id: string
  user_id: string
  title: string
  report_type: ReportType
  date_range_from?: string
  date_range_to?: string
  included_sections: Record<string, boolean>
  report_data: Record<string, unknown>
  ai_summary?: string
  share_token: string
  token_expires_at: string
  is_active: boolean
  view_count: number
  pdf_url?: string
  created_at: string
}

// ---- CAREGIVER ACCESS ----
export interface CaregiverAccess {
  id: string
  patient_id: string
  caregiver_id?: string
  caregiver_email?: string
  caregiver_name: string
  relationship?: string
  invite_token: string
  invite_accepted: boolean
  invite_accepted_at?: string
  invite_expires_at: string
  can_view_appointments: boolean
  can_log_medications: boolean
  can_record_visits: boolean
  can_track_symptoms: boolean
  can_view_documents: boolean
  can_view_journal: boolean
  can_prepare_summaries: boolean
  is_active: boolean
  created_at: string
}

// ---- APPOINTMENT BRIEFING ----
export interface AppointmentBriefing {
  id: string
  user_id: string
  appointment_id?: string
  generated_at: string
  last_visit_summary?: string
  symptom_trends: Record<string, number[]>
  medication_changes: { name: string; change: string; date: string }[]
  treatment_history?: string
  unresolved_concerns?: string
  suggested_questions: string[]
  key_notes?: string
  ai_briefing_text?: string
  pdf_url?: string
  shared_with_doctor: boolean
}

// ---- WELLNESS LOG ----
export interface WellnessLog {
  id: string
  user_id: string
  logged_at: string
  water_ml: number
  sleep_hours?: number
  sleep_quality?: number
  exercise_type?: string
  exercise_mins: number
  rest_mins: number
  supplements?: string
  wellness_notes?: string
  energy_level?: number
  created_at: string
}

// ---- PLAYER STATE ----
export interface PlayerState {
  trackId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

// ---- SIDE-EFFECT INTELLIGENCE ----
export interface SideEffectInsight {
  pattern: SymptomPattern
  chartData: { date: string; severity: number }[]
  relatedTreatments: string[]
  relatedMedications: string[]
  recommendation: string  // always: "discuss with doctor" — never medical advice
}

// ---- EXTENDED PLAN FEATURES ----
export const PLAN_FEATURES_V2 = {
  free: [
    'Patient dashboard',
    'Appointment tracker (5/month)',
    'Basic medication reminders',
    'Daily symptom logging',
    'Gratitude journal',
    'Care Squad (3 members)',
  ],
  support: [
    'Everything in Free',
    'Unlimited appointments & medications',
    'Full reminder dashboard',
    'Symptom charts & trends',
    'Doctor Visit Recorder',
    'Nutrition & wellness tracker',
    'Document vault (2GB)',
    'Short encouragement audio',
    'Educational library',
    'Caregiver mode',
  ],
  premium: [
    'Everything in Support',
    'AI Health Companion',
    'AI Visit Summaries & Action Items',
    'Prepare for Next Appointment (AI-powered)',
    'Treatment Side-Effect Intelligence',
    'Share Health Summary with doctors',
    'Full guided audio library (declarations, meditations)',
    'Play After Reminder audio feature',
    'Scheduled audio sessions',
    'PDF health report export',
    'Document vault (10GB)',
    'Priority support',
  ],
}
