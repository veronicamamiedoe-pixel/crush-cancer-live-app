// ============================================
// CRUSH CANCER & LIVE — Type Definitions
// ============================================

export type UserRole = 'patient' | 'caregiver'
export type PlanTier  = 'free' | 'support' | 'premium'
export type SymptomSeverity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type TreatmentType = 'chemotherapy' | 'radiation' | 'surgery' | 'immunotherapy' | 'hormone' | 'targeted' | 'other'
export type MoodScore = 1 | 2 | 3 | 4 | 5

// ---- USER ----
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  plan: PlanTier
  patient_id?: string       // if role is caregiver, links to patient
  diagnosis?: string
  diagnosis_date?: string
  oncologist?: string
  hospital?: string
  nhs_number?: string
  blood_type?: string
  allergies?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  timezone: string
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

// ---- APPOINTMENT ----
export interface Appointment {
  id: string
  user_id: string
  title: string
  type: TreatmentType | 'checkup' | 'bloodtest' | 'scan' | 'consultation' | 'other'
  date: string
  time: string
  duration_minutes: number
  location: string
  doctor: string
  notes?: string
  transport_needed: boolean
  companion_needed: boolean
  completed: boolean
  reminder_sent: boolean
  created_at: string
}

// ---- TREATMENT SESSION ----
export interface TreatmentSession {
  id: string
  user_id: string
  type: TreatmentType
  session_number: number
  total_sessions?: number
  date: string
  duration_minutes?: number
  drugs_given?: string[]
  location: string
  doctor: string
  pre_treatment_notes?: string
  post_treatment_notes?: string
  side_effects?: string[]
  overall_feeling: SymptomSeverity
  completed: boolean
  created_at: string
}

// ---- MEDICATION ----
export interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  times: string[]           // e.g. ["08:00", "20:00"]
  start_date: string
  end_date?: string
  prescribed_by?: string
  purpose?: string
  side_effects_to_watch?: string
  notes?: string
  active: boolean
  created_at: string
}

export interface MedicationLog {
  id: string
  medication_id: string
  user_id: string
  taken_at: string
  taken: boolean
  side_effects_noted?: string
  notes?: string
}

// ---- SYMPTOM ----
export interface SymptomLog {
  id: string
  user_id: string
  logged_at: string
  pain_level: SymptomSeverity
  fatigue_level: SymptomSeverity
  nausea_level: SymptomSeverity
  appetite_level: SymptomSeverity  // 10 = great, 1 = none
  sleep_quality: SymptomSeverity
  mood: MoodScore
  anxiety_level: SymptomSeverity
  energy_level: SymptomSeverity
  notes?: string
  flagged_for_doctor: boolean
  created_at: string
}

// ---- JOURNAL ----
export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string
  title?: string
  reflection?: string
  gratitude_1?: string
  gratitude_2?: string
  gratitude_3?: string
  prayer?: string
  affirmation?: string
  small_win?: string
  mood: MoodScore
  energy_level: SymptomSeverity
  faith_level: SymptomSeverity
  is_private: boolean
  created_at: string
  updated_at: string
}

// ---- NUTRITION ----
export interface NutritionLog {
  id: string
  user_id: string
  logged_at: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement'
  food_items: string
  water_ml?: number
  appetite_score: SymptomSeverity
  nausea_after: boolean
  notes?: string
  created_at: string
}

// ---- DOCUMENT ----
export interface Document {
  id: string
  user_id: string
  name: string
  category: 'medical_report' | 'test_result' | 'doctor_note' | 'insurance' | 'prescription' | 'scan' | 'other'
  file_url: string
  file_size: number
  file_type: string
  date: string
  doctor?: string
  notes?: string
  is_shared_with_caregiver: boolean
  created_at: string
}

// ---- CARE SQUAD ----
export interface CareSquadMember {
  id: string
  patient_id: string
  caregiver_id?: string
  name: string
  email?: string
  phone?: string
  relationship: string
  can_view_medical: boolean
  can_view_appointments: boolean
  can_view_medications: boolean
  joined_at?: string
  invite_token?: string
  invite_expires_at?: string
  created_at: string
}

export interface CareTask {
  id: string
  patient_id: string
  category: 'transport' | 'meals' | 'cleaning' | 'childcare' | 'shopping' | 'medical' | 'companionship' | 'other'
  title: string
  description?: string
  date?: string
  time?: string
  is_urgent: boolean
  claimed_by_id?: string
  claimed_by_name?: string
  claimed_at?: string
  completed: boolean
  created_at: string
}

// ---- SUBSCRIPTION ----
export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan: PlanTier
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

// ---- AI CONVERSATION ----
export interface AIConversation {
  id: string
  user_id: string
  messages: AIMessage[]
  context_type: 'general' | 'doctor_prep' | 'symptom_summary' | 'encouragement'
  created_at: string
  updated_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ---- DASHBOARD ----
export interface DashboardData {
  user: User
  todayAppointments: Appointment[]
  upcomingAppointments: Appointment[]
  medicationsToday: (Medication & { logsToday: MedicationLog[] })[]
  latestSymptoms: SymptomLog | null
  recentJournalEntry: JournalEntry | null
  symptomTrend: SymptomLog[]
  treatmentProgress: { completed: number; total: number; currentCycle: number }
  careTasksOpen: number
  squadCount: number
}

// ---- API RESPONSES ----
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ---- CHART DATA ----
export interface SymptomChartData {
  date: string
  pain: number
  fatigue: number
  nausea: number
  mood: number
  energy: number
  sleep: number
}

// ---- PLAN FEATURES ----
export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    'Dashboard & basic planner',
    'Appointment tracker (5/month)',
    'Medication reminders (3 meds)',
    'Basic symptom logging',
    'Daily journal',
    'Care Squad (3 members)',
  ],
  support: [
    'Everything in Free',
    'Unlimited appointments',
    'Unlimited medications',
    'Full symptom tracking with charts',
    'Nutrition & wellness tracker',
    'Document vault (2GB)',
    'Care Squad (unlimited)',
    'Treatment planner',
    'Educational library',
    'Email support',
  ],
  premium: [
    'Everything in Support',
    'AI Health Assistant (Claude-powered)',
    'AI doctor appointment prep',
    'AI symptom summariser',
    'Document vault (10GB)',
    'Caregiver mode (full access)',
    'Priority support',
    'Export health reports (PDF)',
    'Advanced analytics',
    'Spiritual & prayer community',
  ],
}

export const PLAN_PRICES: Record<PlanTier, { monthly: number; display: string }> = {
  free:    { monthly: 0,   display: 'Free' },
  support: { monthly: 19,  display: '£19/month' },
  premium: { monthly: 49,  display: '£49/month' },
}
