'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronUp, Brain, Flag, CheckCircle,
  Clock, Stethoscope, MapPin, Calendar, FileText, X, Save
} from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import type { DoctorVisit, ActionItem } from '@/types/v2'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const SPECIALTIES = [
  'Oncology','Medical Oncology','Surgical Oncology','Radiation Oncology',
  'Haematology','Breast Surgery','Colorectal Surgery','Gynaecology',
  'Palliative Care','GP / Primary Care','Radiology','Pathology',
  'Physiotherapy','Psychology / Counselling','Nutrition / Dietitian','Other',
]

const defaultForm = {
  title: '', visit_date: '', visit_time: '', doctor_name: '',
  hospital: '', specialty: '', reason_for_visit: '', symptoms_discussed: '',
  consultation_notes: '', test_results: '', medication_changes: '',
  treatment_recommendations: '', follow_up_actions: '', next_appointment_date: '',
  questions_for_next: '', emotional_reflection: '', companion_name: '',
  pre_anxiety_level: 5, post_feeling: '',
  vital_weight: '', vital_bp: '', vital_hr: '',
  vital_temp: '', vital_o2: '', vital_blood_sugar: '',
}

export default function DoctorVisitsPage() {
  const [visits, setVisits]       = useState<DoctorVisit[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(defaultForm)
  const [saving, setSaving]       = useState(false)
  const [generatingAI, setGenAI]  = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'visits'|'actions'>('visits')

  const fetchVisits = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('doctor_visits').select('*')
      .eq('user_id', user.id).order('visit_date', { ascending: false })
    setVisits(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchVisits() }, [fetchVisits])

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const saveVisit = async (generateAI = false) => {
    if (!form.title || !form.visit_date) { toast.error('Please add a title and date'); return }
    setSaving(true)
    if (generateAI) setGenAI(true)

    try {
      const res = await fetch('/api/doctor-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, generateAI }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(generateAI ? '✅ Visit saved with AI summary!' : '✅ Visit saved!')
      setForm(defaultForm)
      setShowForm(false)
      fetchVisits()
    } catch {
      toast.error('Could not save visit')
    } finally {
      setSaving(false)
      setGenAI(false)
    }
  }

  const completeAction = async (visitId: string, actionTitle: string) => {
    const supabase = createClient()
    await supabase.from('visit_action_items')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('visit_id', visitId).eq('title', actionTitle)
    fetchVisits()
    toast.success('✅ Action completed!')
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Record · Summarise · Prepare</p>
            <h2 className="font-display text-4xl text-gray-900">
              Doctor <span className="text-pink-500">Visits</span>
            </h2>
            <p className="sec-intro">
              Record every consultation in detail. Get AI summaries and action items.
              Use your visit history to prepare for your next appointment.
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Record Visit
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Visits',    value: visits.length,                                  colour: 'text-pink-500',  bg: 'bg-pink-50'  },
            { label: 'With AI Summary', value: visits.filter(v => v.ai_summary).length,        colour: 'text-teal-600',  bg: 'bg-teal-50'  },
            { label: 'Open Actions',    value: visits.reduce((n, v) => n + (v.ai_action_items?.filter((a:ActionItem) => !a.completed)?.length || 0), 0), colour: 'text-gold-600', bg: 'bg-gold-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['visits','actions'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-5 py-2.5 rounded-full text-sm font-bold transition-all capitalize',
                activeTab === tab ? 'bg-pink-500 text-white shadow-pink' : 'bg-white border border-pink-100 text-gray-500')}>
              {tab === 'visits' ? '🏥 Visit Records' : '✅ Pending Actions'}
            </button>
          ))}
        </div>

        {/* Visit record form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white rounded-3xl border-2 border-pink-200 shadow-pink p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-pink-500" /> Record Doctor Visit
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-4 h-4" /></button>
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  <div className="lg:col-span-2">
                    <label className="ccl-label">Visit Title *</label>
                    <input className="ccl-input" value={form.title} onChange={f('title')} placeholder="e.g. Oncology Review — Cycle 4 Results" />
                  </div>
                  <div>
                    <label className="ccl-label">Date *</label>
                    <input type="date" className="ccl-input" value={form.visit_date} onChange={f('visit_date')} />
                  </div>
                  <div>
                    <label className="ccl-label">Time</label>
                    <input type="time" className="ccl-input" value={form.visit_time} onChange={f('visit_time')} />
                  </div>
                  <div>
                    <label className="ccl-label">Doctor / Specialist</label>
                    <input className="ccl-input" value={form.doctor_name} onChange={f('doctor_name')} placeholder="Dr. Name" />
                  </div>
                  <div>
                    <label className="ccl-label">Specialty</label>
                    <select className="ccl-select" value={form.specialty} onChange={f('specialty')}>
                      <option value="">Select...</option>
                      {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ccl-label">Hospital / Clinic</label>
                    <input className="ccl-input" value={form.hospital} onChange={f('hospital')} placeholder="Hospital name" />
                  </div>
                  <div>
                    <label className="ccl-label">Who came with me</label>
                    <input className="ccl-input" value={form.companion_name} onChange={f('companion_name')} placeholder="Name of companion" />
                  </div>
                </div>

                {/* Vitals */}
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-5">
                  <p className="font-bold text-sm text-teal-700 mb-3">📊 Vitals Recorded</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                      { key: 'vital_weight', label: 'Weight', unit: 'kg', placeholder: '—' },
                      { key: 'vital_bp',     label: 'BP',     unit: 'mmHg', placeholder: '120/80' },
                      { key: 'vital_hr',     label: 'HR',     unit: 'bpm', placeholder: '—' },
                      { key: 'vital_temp',   label: 'Temp',   unit: '°C', placeholder: '—' },
                      { key: 'vital_o2',     label: 'O₂',     unit: '%', placeholder: '—' },
                      { key: 'vital_blood_sugar', label: 'Blood Sugar', unit: 'mmol', placeholder: '—' },
                    ].map(v => (
                      <div key={v.key} className="text-center">
                        <p className="text-xs font-bold text-teal-600 mb-1">{v.label}</p>
                        <input className="w-full text-center border-none bg-white rounded-xl px-2 py-2 text-sm font-bold focus:ring-2 focus:ring-teal-300 outline-none"
                          value={(form as any)[v.key]} onChange={f(v.key as any)} placeholder={v.placeholder} />
                        <p className="text-xs text-gray-400 mt-0.5">{v.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="ccl-label">Reason for Visit</label>
                    <textarea className="ccl-textarea" value={form.reason_for_visit} onChange={f('reason_for_visit')} placeholder="Why did you attend this appointment?" />
                  </div>
                  <div>
                    <label className="ccl-label">Symptoms Discussed</label>
                    <textarea className="ccl-textarea" value={form.symptoms_discussed} onChange={f('symptoms_discussed')} placeholder="What symptoms did you tell the doctor about?" />
                  </div>
                  <div>
                    <label className="ccl-label">Doctor's Consultation Notes</label>
                    <textarea className="ccl-textarea" value={form.consultation_notes} onChange={f('consultation_notes')} placeholder="What did the doctor say? Their assessment, findings..." />
                  </div>
                  <div>
                    <label className="ccl-label">Test Results Discussed</label>
                    <textarea className="ccl-textarea" value={form.test_results} onChange={f('test_results')} placeholder="Blood counts, tumour markers, scan results..." />
                  </div>
                  <div>
                    <label className="ccl-label">Medication Changes</label>
                    <textarea className="ccl-textarea" value={form.medication_changes} onChange={f('medication_changes')} placeholder="Any new medications, dosage changes, or stopped meds..." />
                  </div>
                  <div>
                    <label className="ccl-label">Treatment Recommendations</label>
                    <textarea className="ccl-textarea" value={form.treatment_recommendations} onChange={f('treatment_recommendations')} placeholder="What treatment plan was decided..." />
                  </div>
                  <div>
                    <label className="ccl-label">Follow-up Actions Required</label>
                    <textarea className="ccl-textarea" value={form.follow_up_actions} onChange={f('follow_up_actions')} placeholder="Tasks: collect prescription, book scan, etc..." />
                  </div>
                  <div>
                    <label className="ccl-label">Next Appointment Date</label>
                    <input type="date" className="ccl-input" value={form.next_appointment_date} onChange={f('next_appointment_date')} />
                    <label className="ccl-label mt-2">Questions for Next Visit</label>
                    <textarea className="ccl-textarea" value={form.questions_for_next} onChange={f('questions_for_next')} placeholder="Things you want to ask next time..." />
                  </div>
                </div>

                {/* Emotional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="ccl-label">Anxiety Before Visit — {form.pre_anxiety_level}/10</label>
                    <input type="range" min="1" max="10" value={form.pre_anxiety_level}
                      onChange={e => setForm(f => ({ ...f, pre_anxiety_level: Number(e.target.value) }))}
                      className="w-full accent-purple-500 mt-1" />
                  </div>
                  <div>
                    <label className="ccl-label">How I Felt Leaving the Appointment</label>
                    <input className="ccl-input" value={form.post_feeling} onChange={f('post_feeling')} placeholder="e.g. Relieved, anxious, hopeful..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="ccl-label">Emotional Reflection</label>
                    <textarea className="ccl-textarea" value={form.emotional_reflection} onChange={f('emotional_reflection')} placeholder="How did this visit make you feel? What's on your heart?" />
                  </div>
                </div>

                {/* Save buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => saveVisit(false)} disabled={saving} className="btn-primary">
                    <Save className="w-4 h-4" /> {saving && !generatingAI ? 'Saving...' : 'Save Visit'}
                  </button>
                  <button onClick={() => saveVisit(true)} disabled={saving} className="btn-teal">
                    <Brain className="w-4 h-4" /> {generatingAI ? 'Generating AI Summary...' : 'Save + AI Summary'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  AI Summary extracts action items, generates follow-up questions, and creates a patient-friendly recap.
                  Premium feature. Does not provide medical advice.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visits list */}
        {activeTab === 'visits' && (
          loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
          ) : visits.length === 0 ? (
            <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center">
              <Stethoscope className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-gray-600">No visit records yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Record Visit" to start documenting your appointments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((visit, i) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  index={i}
                  expanded={expanded === visit.id}
                  onToggle={() => setExpanded(expanded === visit.id ? null : visit.id)}
                  onCompleteAction={completeAction}
                />
              ))}
            </div>
          )
        )}

        {/* Pending actions tab */}
        {activeTab === 'actions' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 font-light">Action items extracted from all your visit records.</p>
            {visits.flatMap(v =>
              (v.ai_action_items || [])
                .filter((a: ActionItem) => !a.completed)
                .map((action: ActionItem, i: number) => (
                  <div key={`${v.id}-${i}`}
                    className={cn('bg-white rounded-2xl border-2 p-4 flex items-center gap-4',
                      action.is_urgent ? 'border-red-200 bg-red-50/20' : 'border-pink-100')}>
                    <button onClick={() => completeAction(v.id, action.title)}
                      className="w-8 h-8 rounded-full border-2 border-teal-300 hover:bg-teal-50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Check className="w-4 h-4 text-teal-500" />
                    </button>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">{action.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">From: {v.title} · {format(parseISO(v.visit_date), 'dd MMM yyyy')}</p>
                    </div>
                    {action.is_urgent && <span className="badge-red">🔴 Urgent</span>}
                  </div>
                ))
            )}
            {visits.every(v => (v.ai_action_items || []).every((a: ActionItem) => a.completed)) && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center">
                <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                <p className="font-bold text-teal-700">All caught up! 🎉</p>
                <p className="text-xs text-teal-600 mt-1">No pending actions from your visits.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── Visit Card ─────────────────────────────────────────────────
function VisitCard({ visit, index, expanded, onToggle, onCompleteAction }: {
  visit: DoctorVisit; index: number; expanded: boolean
  onToggle: () => void; onCompleteAction: (id: string, title: string) => void
}) {
  const openActions = (visit.ai_action_items || []).filter((a: ActionItem) => !a.completed).length

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border-2 border-pink-100 overflow-hidden hover:border-pink-200 transition-all">

      {/* Card header */}
      <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={onToggle}>
        <div className="bg-pink-500 text-white rounded-2xl px-3 py-2 text-center flex-shrink-0 min-w-[56px]">
          <p className="text-lg font-bold leading-none">{format(parseISO(visit.visit_date), 'd')}</p>
          <p className="text-xs font-bold uppercase">{format(parseISO(visit.visit_date), 'MMM')}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800">{visit.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            {visit.doctor_name && <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{visit.doctor_name}</span>}
            {visit.hospital && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{visit.hospital}</span>}
            {visit.visit_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{visit.visit_time}</span>}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {visit.specialty && <span className="badge-teal">{visit.specialty}</span>}
            {visit.ai_summary && <span className="badge-pink flex items-center gap-1"><Brain className="w-3 h-3" />AI Summary</span>}
            {openActions > 0 && <span className="badge-gold">{openActions} action{openActions > 1 ? 's' : ''}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-gray-100 p-5 space-y-5">

              {/* AI Summary */}
              {visit.ai_summary && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI-Generated Summary
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{visit.ai_summary}</p>
                  <p className="text-xs text-gray-400 mt-2 italic">This is a summary of your own notes. It is not medical advice.</p>
                </div>
              )}

              {/* Notes grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Reason for Visit',           value: visit.reason_for_visit          },
                  { label: 'Symptoms Discussed',          value: visit.symptoms_discussed         },
                  { label: "Doctor's Notes",             value: visit.consultation_notes         },
                  { label: 'Test Results',                value: visit.test_results              },
                  { label: 'Medication Changes',          value: visit.medication_changes         },
                  { label: 'Treatment Recommendations',   value: visit.treatment_recommendations  },
                  { label: 'Follow-up Actions',           value: visit.follow_up_actions          },
                  { label: 'Emotional Reflection',        value: visit.emotional_reflection       },
                ].filter(s => s.value).map(s => (
                  <div key={s.label}>
                    <p className="ccl-label">{s.label}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Vitals */}
              {(visit.vital_weight || visit.vital_bp || visit.vital_hr) && (
                <div>
                  <p className="ccl-label mb-2">Vitals</p>
                  <div className="flex gap-3 flex-wrap">
                    {visit.vital_weight     && <span className="badge-teal">⚖️ {visit.vital_weight} kg</span>}
                    {visit.vital_bp         && <span className="badge-teal">❤️ {visit.vital_bp} mmHg</span>}
                    {visit.vital_hr         && <span className="badge-teal">💓 {visit.vital_hr} bpm</span>}
                    {visit.vital_temp       && <span className="badge-teal">🌡️ {visit.vital_temp}°C</span>}
                    {visit.vital_o2         && <span className="badge-teal">💧 {visit.vital_o2}% O₂</span>}
                    {visit.vital_blood_sugar && <span className="badge-teal">🩸 {visit.vital_blood_sugar} mmol</span>}
                  </div>
                </div>
              )}

              {/* Action items */}
              {(visit.ai_action_items || []).length > 0 && (
                <div>
                  <p className="ccl-label mb-2">✅ Action Items</p>
                  <div className="space-y-2">
                    {(visit.ai_action_items as ActionItem[]).map((action, i) => (
                      <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl border',
                        action.completed ? 'bg-teal-50 border-teal-200 opacity-70' : action.is_urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200')}>
                        <button onClick={() => !action.completed && onCompleteAction(visit.id, action.title)}
                          className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                            action.completed ? 'bg-teal-500 border-teal-500' : 'border-gray-300 hover:border-teal-400')}>
                          {action.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={cn('text-sm font-semibold', action.completed && 'line-through text-gray-400')}>{action.title}</span>
                        {action.is_urgent && !action.completed && <span className="badge-red ml-auto">Urgent</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Questions */}
              {(visit.ai_questions || []).length > 0 && (
                <div>
                  <p className="ccl-label mb-2">❓ AI Suggested Questions for Next Visit</p>
                  <ol className="space-y-1">
                    {(visit.ai_questions as string[]).map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {visit.next_appointment_date && (
                <div className="flex items-center gap-3 bg-pink-50 border border-pink-200 rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-pink-700">
                    Next appointment: {format(parseISO(visit.next_appointment_date), 'EEEE dd MMMM yyyy')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Check({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
}
