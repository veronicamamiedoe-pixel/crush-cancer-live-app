import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { SymptomLog, TreatmentSession, Medication } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "placeholder" })

// ----------------------------------------------------------------
// DISCLAIMER — enforced in every analysis response
// ----------------------------------------------------------------
const ANALYSIS_DISCLAIMER = `
IMPORTANT: This analysis identifies patterns only. It does not provide medical advice,
diagnosis, or treatment recommendations. All patterns should be discussed with
the patient's oncologist or medical team.
`

// ----------------------------------------------------------------
// Identify patterns from raw symptom + treatment data
// ----------------------------------------------------------------
export async function analyseSideEffectPatterns(userId: string) {
  const supabase = createClient()

  // Fetch last 60 days of data
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: symptoms },
    { data: treatments },
    { data: medications },
  ] = await Promise.all([
    supabase.from('symptoms').select('*')
      .eq('user_id', userId).gte('logged_at', sixtyDaysAgo)
      .order('logged_at', { ascending: true }),
    supabase.from('treatment_plans').select('*')
      .eq('user_id', userId).gte('date', sixtyDaysAgo.split('T')[0])
      .order('date', { ascending: true }),
    supabase.from('medications').select('*')
      .eq('user_id', userId).eq('active', true),
  ])

  if (!symptoms?.length) return []

  // Build compact data summary for AI
  const dataSummary = buildDataSummary(
    symptoms as SymptomLog[],
    treatments as TreatmentSession[],
    medications as Medication[]
  )

  // Run AI pattern analysis
  const patterns = await runPatternAnalysis(dataSummary)

  // Save patterns to DB
  if (patterns.length > 0) {
    // Clear old undismissed patterns
    await supabase.from('ai_insights')
      .delete()
      .eq('user_id', userId)
      .eq('dismissed', false)

    const rows = patterns.map(p => ({
      user_id: userId,
      pattern_type:   p.pattern_type,
      title:          p.title,
      description:    p.description,
      severity:       p.severity,
      confidence:     p.confidence,
      symptom_keys:   p.symptom_keys,
      treatment_types:p.treatment_types,
      data_points:    p.data_points,
      raw_analysis:   p,
    }))

    await supabase.from('ai_insights').insert(rows)
  }

  return patterns
}

// ----------------------------------------------------------------
// Build compact data summary string for the AI prompt
// ----------------------------------------------------------------
function buildDataSummary(
  symptoms: SymptomLog[],
  treatments: TreatmentSession[],
  medications: Medication[]
): string {
  const symSummary = symptoms.slice(-30).map(s =>
    `[${s.logged_at?.split('T')[0]}] pain:${s.pain_level} fatigue:${s.fatigue_level} ` +
    `nausea:${s.nausea_level} appetite:${s.appetite_level} sleep:${s.sleep_quality} ` +
    `mood:${s.mood} energy:${s.energy_level} anxiety:${s.anxiety_level}`
  ).join('\n')

  const txSummary = treatments.map(t =>
    `[${t.date}] ${t.type} session${t.session_number} at ${t.location || 'unknown'}`
  ).join('\n')

  const medSummary = medications.map(m =>
    `${m.name} ${m.dosage} ${m.frequency}`
  ).join(', ')

  return `
SYMPTOM LOGS (date, pain/10, fatigue/10, nausea/10, appetite/10, sleep/10, mood/5, energy/10, anxiety/10):
${symSummary || 'No symptom logs'}

TREATMENT SESSIONS:
${txSummary || 'No treatments recorded'}

ACTIVE MEDICATIONS:
${medSummary || 'No medications'}
`
}

// ----------------------------------------------------------------
// AI pattern analysis — returns structured pattern objects
// ----------------------------------------------------------------
async function runPatternAnalysis(dataSummary: string) {
  const prompt = `You are a clinical data analyst helping a cancer patient understand symptom patterns. 
Analyse the following health data and identify notable patterns.

${dataSummary}

${ANALYSIS_DISCLAIMER}

Identify up to 5 significant patterns. For each pattern respond ONLY with valid JSON array:
[
  {
    "pattern_type": "short_snake_case_key",
    "title": "Brief pattern title (max 8 words)",
    "description": "Patient-friendly description of the pattern (2-3 sentences). Must not include medical advice. Must end with: 'Please discuss this pattern with your doctor.'",
    "severity": "mild|moderate|significant",
    "confidence": 65,
    "symptom_keys": ["fatigue","nausea"],
    "treatment_types": ["chemotherapy"],
    "data_points": 8,
    "recommendation": "Please discuss this pattern with your oncologist at your next appointment."
  }
]

Rules:
- Only return the JSON array, no other text
- Never provide medical advice or diagnoses
- Keep descriptions compassionate and clear
- If insufficient data, return empty array []
- confidence must be 50-95 (never over-claim)
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = completion.choices[0]?.message?.content?.trim() || '[]'
    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const patterns = JSON.parse(cleaned)
    return Array.isArray(patterns) ? patterns : []
  } catch (err) {
    console.error('Pattern analysis error:', err)
    return []
  }
}

// ----------------------------------------------------------------
// Generate chart data for a pattern
// ----------------------------------------------------------------
export async function getPatternChartData(userId: string, symptomKey: string, days = 30) {
  const supabase = createClient()
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('symptoms')
    .select(`logged_at, ${symptomKey}`)
    .eq('user_id', userId)
    .gte('logged_at', from)
    .order('logged_at', { ascending: true })

  return (data || []).map((row: any) => ({
    date: row.logged_at?.split('T')[0],
    severity: row[symptomKey] ?? 0,
  }))
}

// ----------------------------------------------------------------
// Generate AI visit summary
// ----------------------------------------------------------------
export async function generateVisitSummary(visitData: Record<string, string>) {
  const prompt = `You are a compassionate medical note assistant helping a cancer patient understand their doctor visit.

Visit details:
Doctor: ${visitData.doctor_name || 'Unknown'}
Date: ${visitData.visit_date}
Reason: ${visitData.reason_for_visit || 'General consultation'}
Symptoms discussed: ${visitData.symptoms_discussed || 'Not recorded'}
Consultation notes: ${visitData.consultation_notes || 'Not recorded'}
Test results: ${visitData.test_results || 'Not recorded'}
Medication changes: ${visitData.medication_changes || 'None recorded'}
Treatment recommendations: ${visitData.treatment_recommendations || 'Not recorded'}
Follow-up actions: ${visitData.follow_up_actions || 'Not recorded'}

Please provide:
1. A clear, patient-friendly 3-4 sentence summary of this visit
2. A JSON array of action items extracted from the notes
3. A JSON array of 4-6 suggested questions for the next visit

Format response as JSON:
{
  "summary": "...",
  "action_items": [{"title": "...", "is_urgent": false}],
  "questions": ["...", "..."]
}

${ANALYSIS_DISCLAIMER}
Do not provide medical advice. Only summarise and organise the existing notes.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1200,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = completion.choices[0]?.message?.content?.trim() || '{}'
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { summary: '', action_items: [], questions: [] }
  }
}

// ----------------------------------------------------------------
// Generate appointment briefing
// ----------------------------------------------------------------
export async function generateAppointmentBriefing(userId: string, appointmentId?: string) {
  const supabase = createClient()
  const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: lastVisit },
    { data: recentSymptoms },
    { data: medications },
    { data: treatments },
    { data: patterns },
  ] = await Promise.all([
    supabase.from('doctor_visits').select('*').eq('user_id', userId)
      .order('visit_date', { ascending: false }).limit(1).single(),
    supabase.from('symptoms').select('*').eq('user_id', userId)
      .gte('logged_at', thirtyDays).order('logged_at', { ascending: false }),
    supabase.from('medications').select('*').eq('user_id', userId).eq('active', true),
    supabase.from('treatment_plans').select('*').eq('user_id', userId)
      .order('date', { ascending: false }).limit(3),
    supabase.from('ai_insights').select('*').eq('user_id', userId).eq('dismissed', false),
  ])

  const avgSymptoms = calcAverageSymptoms(recentSymptoms || [])

  const prompt = `You are helping a cancer patient prepare for their upcoming doctor appointment.

LAST DOCTOR VISIT (${lastVisit?.visit_date || 'None recorded'}):
${lastVisit?.consultation_notes || 'No notes'}
Follow-up actions: ${lastVisit?.follow_up_actions || 'None'}

RECENT SYMPTOM AVERAGES (last 30 days, scale 1-10):
${JSON.stringify(avgSymptoms)}

ACTIVE MEDICATIONS: ${medications?.map((m: any) => m.name).join(', ') || 'None'}

RECENT TREATMENTS: ${treatments?.map((t: any) => `${t.type} on ${t.date}`).join(', ') || 'None'}

IDENTIFIED PATTERNS: ${patterns?.map((p: any) => p.title).join('; ') || 'None'}

Generate a patient-friendly appointment briefing including:
1. Summary of health since last visit (3-4 sentences)
2. Key symptoms to mention (based on trends)
3. 6-8 suggested questions to ask the doctor
4. Key concerns to raise

Format as JSON:
{
  "last_visit_summary": "...",
  "symptom_trends_text": "...",
  "key_concerns": "...",
  "suggested_questions": ["...", "..."],
  "briefing_text": "Full readable briefing paragraph..."
}

${ANALYSIS_DISCLAIMER}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = completion.choices[0]?.message?.content?.trim() || '{}'
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleaned)

    // Save briefing
    await supabase.from('appointment_briefings').insert({
      user_id: userId,
      appointment_id: appointmentId,
      last_visit_summary:  result.last_visit_summary,
      symptom_trends:      avgSymptoms,
      medication_changes:  [],
      treatment_history:   treatments?.map((t: any) => `${t.type} on ${t.date}`).join(', '),
      unresolved_concerns: result.key_concerns,
      suggested_questions: result.suggested_questions,
      key_notes:           result.symptom_trends_text,
      ai_briefing_text:    result.briefing_text,
    })

    return result
  } catch (err) {
    console.error('Briefing error:', err)
    return null
  }
}

function calcAverageSymptoms(logs: any[]) {
  if (!logs.length) return {}
  const keys = ['pain_level','fatigue_level','nausea_level','appetite_level','sleep_quality','energy_level','mood','anxiety_level']
  const sums: Record<string, number> = {}
  keys.forEach(k => { sums[k] = 0 })
  logs.forEach(l => keys.forEach(k => { sums[k] += l[k] || 0 }))
  const result: Record<string, number> = {}
  keys.forEach(k => { result[k] = Math.round((sums[k] / logs.length) * 10) / 10 })
  return result
}
