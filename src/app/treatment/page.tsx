'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { TreatmentSession } from '@/types'
import toast from 'react-hot-toast'

const TREATMENT_TYPES = [
  { value: 'chemotherapy', label: '💊 Chemotherapy',    color: 'text-pink-500',  bg: 'bg-pink-50',  border: 'border-pink-200' },
  { value: 'radiation',    label: '☀️ Radiation',       color: 'text-gold-600',  bg: 'bg-gold-50',  border: 'border-gold-200' },
  { value: 'surgery',      label: '🏥 Surgery',         color: 'text-teal-600',  bg: 'bg-teal-50',  border: 'border-teal-200' },
  { value: 'immunotherapy',label: '🛡 Immunotherapy',   color: 'text-purple-600',bg: 'bg-purple-50',border: 'border-purple-200' },
  { value: 'hormone',      label: '⚗️ Hormone Therapy', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'targeted',     label: '🎯 Targeted Therapy',color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200' },
  { value: 'other',        label: '✨ Other',            color: 'text-gray-600',  bg: 'bg-gray-50',  border: 'border-gray-200' },
]

const defaultSession = {
  type: 'chemotherapy', session_number: 1, total_sessions: 6,
  date: '', duration_minutes: 180, location: '', doctor: '',
  drugs_given: '', pre_treatment_notes: '', post_treatment_notes: '',
  side_effects: '', overall_feeling: 5, completed: false,
}

export default function TreatmentPage() {
  const [sessions, setSessions] = useState<TreatmentSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(defaultSession)
  const [saving, setSaving]     = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('treatment_sessions')
      .select('*').eq('user_id', user.id).order('date', { ascending: false })
    setSessions(data || [])
  }

  const saveSession = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...form,
      user_id: user.id,
      drugs_given:  form.drugs_given  ? form.drugs_given.split(',').map(s => s.trim())  : [],
      side_effects: form.side_effects ? form.side_effects.split(',').map(s => s.trim()) : [],
    }

    const { error } = await supabase.from('treatment_sessions').insert(payload)
    if (error) { toast.error('Could not save session'); setSaving(false); return }
    toast.success('✅ Treatment session saved!')
    setForm(defaultSession)
    setShowForm(false)
    setSaving(false)
    fetchSessions()
  }

  const toggleComplete = async (session: TreatmentSession) => {
    const supabase = createClient()
    await supabase.from('treatment_sessions')
      .update({ completed: !session.completed }).eq('id', session.id)
    fetchSessions()
  }

  const completed  = sessions.filter(s => s.completed).length
  const total      = sessions.length
  const pct        = total ? Math.round((completed / total) * 100) : 0

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Your Roadmap to Healing</p>
            <h2 className="font-display text-4xl text-gray-900">Treatment <span className="text-teal-500">Planner</span></h2>
            <p className="sec-intro">Track every session, record how you felt, and see your progress.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-teal">
            <Plus className="w-4 h-4" /> Log Session
          </button>
        </div>

        {/* Progress summary */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Sessions', value: total,     color: 'text-gray-700', bg: 'bg-gray-50' },
              { label: 'Completed',      value: completed, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Remaining',      value: total - completed, color: 'text-pink-600', bg: 'bg-pink-50' },
              { label: 'Progress',       value: `${pct}%`, color: 'text-gold-600', bg: 'bg-gold-50' },
            ].map((s, i) => (
              <div key={i} className={`ccl-card p-4 ${s.bg}`}>
                <p className={`stat-value ${s.color}`}>{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Overall progress bar */}
        {sessions.length > 0 && (
          <div className="ccl-card p-5">
            <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
              <span>Treatment Progress</span>
              <span className="text-teal-600">{pct}% Complete</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-teal-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{completed} of {total} sessions logged as complete</p>
          </div>
        )}

        {/* Type breakdown */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TREATMENT_TYPES.filter(t => sessions.some(s => s.type === t.value)).map(type => {
              const count = sessions.filter(s => s.type === type.value).length
              const done  = sessions.filter(s => s.type === type.value && s.completed).length
              return (
                <div key={type.value} className={`p-4 rounded-2xl border ${type.bg} ${type.border}`}>
                  <p className="text-base font-bold">{type.label.split(' ').slice(1).join(' ')}</p>
                  <p className={`text-2xl font-bold mt-1 ${type.color}`}>{count}</p>
                  <p className="text-xs text-gray-500">{done}/{count} done</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Log form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="ccl-card ccl-card-teal p-6"
          >
            <h3 className="font-bold text-lg text-gray-800 mb-5">📋 Log Treatment Session</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="ccl-label">Treatment Type</label>
                <select className="ccl-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TREATMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ccl-label">Session Number</label>
                <input type="number" className="ccl-input" value={form.session_number} min="1"
                  onChange={e => setForm(f => ({ ...f, session_number: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="ccl-label">Total Sessions Planned</label>
                <input type="number" className="ccl-input" value={form.total_sessions || ''} min="1"
                  onChange={e => setForm(f => ({ ...f, total_sessions: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="ccl-label">Date</label>
                <input type="date" className="ccl-input" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="ccl-label">Duration (minutes)</label>
                <input type="number" className="ccl-input" value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="ccl-label">Location / Hospital</label>
                <input type="text" className="ccl-input" value={form.location} placeholder="Hospital name"
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="ccl-label">Doctor / Oncologist</label>
                <input type="text" className="ccl-input" value={form.doctor} placeholder="Dr..."
                  onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
              </div>
              <div>
                <label className="ccl-label">Drugs / Medications Given</label>
                <input type="text" className="ccl-input" value={form.drugs_given}
                  placeholder="Comma-separated e.g. FEC, Docetaxel"
                  onChange={e => setForm(f => ({ ...f, drugs_given: e.target.value }))} />
              </div>
              <div>
                <label className="ccl-label">Overall Feeling — {form.overall_feeling}/10</label>
                <input type="range" min="1" max="10" value={form.overall_feeling}
                  className="w-full mt-2 accent-teal-500"
                  onChange={e => setForm(f => ({ ...f, overall_feeling: Number(e.target.value) }))} />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Very rough</span><span>Feeling good</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="ccl-label">Pre-Treatment Notes</label>
                <textarea className="ccl-textarea" value={form.pre_treatment_notes}
                  placeholder="How were you feeling before?"
                  onChange={e => setForm(f => ({ ...f, pre_treatment_notes: e.target.value }))} />
              </div>
              <div>
                <label className="ccl-label">Post-Treatment Notes</label>
                <textarea className="ccl-textarea" value={form.post_treatment_notes}
                  placeholder="How did it go? Any immediate reactions?"
                  onChange={e => setForm(f => ({ ...f, post_treatment_notes: e.target.value }))} />
              </div>
              <div>
                <label className="ccl-label">Side Effects Experienced</label>
                <input type="text" className="ccl-input" value={form.side_effects}
                  placeholder="Comma-separated e.g. nausea, fatigue, hair loss"
                  onChange={e => setForm(f => ({ ...f, side_effects: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="completed-cb" checked={form.completed}
                  onChange={e => setForm(f => ({ ...f, completed: e.target.checked }))}
                  className="w-5 h-5 accent-teal-500" />
                <label htmlFor="completed-cb" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Mark this session as completed
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={saveSession} disabled={saving || !form.date} className="btn-teal">
                {saving ? 'Saving...' : '💾 Save Session'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Session list */}
        {sessions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">All Sessions</h3>
            {sessions.map(session => {
              const typeInfo = TREATMENT_TYPES.find(t => t.value === session.type) || TREATMENT_TYPES[0]
              const isExpanded = expanded === session.id
              return (
                <div key={session.id} className={`ccl-card overflow-hidden transition-all ${session.completed ? 'opacity-80' : ''}`}>
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : session.id)}
                  >
                    {/* Complete toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleComplete(session) }}
                      className="flex-shrink-0"
                      aria-label="Toggle complete"
                    >
                      {session.completed
                        ? <CheckCircle className="w-6 h-6 text-teal-500" />
                        : <Clock className="w-6 h-6 text-gray-300" />
                      }
                    </button>

                    {/* Type badge */}
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${typeInfo.bg} ${typeInfo.border} ${typeInfo.color} flex-shrink-0`}>
                      {typeInfo.label}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${session.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        Session {session.session_number}
                        {session.total_sessions ? ` of ${session.total_sessions}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.date ? format(new Date(session.date), 'EEEE dd MMMM yyyy') : 'No date'} · {session.location || 'No location'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <FeelingBadge score={session.overall_feeling} />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-gray-100 p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {session.doctor && (
                          <div><p className="ccl-label">Doctor</p><p className="font-medium">{session.doctor}</p></div>
                        )}
                        {session.duration_minutes && (
                          <div><p className="ccl-label">Duration</p><p className="font-medium">{session.duration_minutes} minutes</p></div>
                        )}
                        {session.drugs_given?.length > 0 && (
                          <div><p className="ccl-label">Drugs Given</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {session.drugs_given.map((d, i) => <span key={i} className="badge-pink">{d}</span>)}
                            </div>
                          </div>
                        )}
                        {session.side_effects?.length > 0 && (
                          <div><p className="ccl-label">Side Effects</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {session.side_effects.map((s, i) => <span key={i} className="badge-gold">{s}</span>)}
                            </div>
                          </div>
                        )}
                        {session.pre_treatment_notes && (
                          <div className="sm:col-span-2"><p className="ccl-label">Pre-Treatment Notes</p><p className="text-gray-600">{session.pre_treatment_notes}</p></div>
                        )}
                        {session.post_treatment_notes && (
                          <div className="sm:col-span-2"><p className="ccl-label">Post-Treatment Notes</p><p className="text-gray-600">{session.post_treatment_notes}</p></div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="ccl-card p-12 text-center">
            <div className="text-5xl mb-4 animate-float">💊</div>
            <p className="font-bold text-lg text-gray-700">No treatment sessions yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Log Session" to start tracking your treatment journey.</p>
          </div>
        )}

      </div>
    </AppShell>
  )
}

function FeelingBadge({ score }: { score: number }) {
  const isGood = score >= 7
  const isBad  = score <= 3
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
      isGood ? 'bg-teal-100 text-teal-700' :
      isBad  ? 'bg-red-100 text-red-600'   :
               'bg-yellow-100 text-yellow-700'
    }`}>
      Feeling: {score}/10
    </span>
  )
}
