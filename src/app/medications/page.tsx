'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pill, X, ChevronDown, ChevronUp,
  Clock, Calendar, AlertTriangle, Archive, RotateCcw
} from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO, isToday } from 'date-fns'
import type { Medication, MedicationLog } from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const FREQUENCIES = [
  'Once daily','Twice daily','Three times daily','Four times daily',
  'Every 8 hours','Every 12 hours','Weekly','As needed (PRN)',
  'Before meals','After meals','At bedtime','Other',
]

const TIMES_OF_DAY = ['06:00','07:00','08:00','09:00','12:00','13:00',
  '14:00','17:00','18:00','20:00','21:00','22:00']

const defaultForm = {
  name: '', dosage: '', frequency: 'Once daily', times: ['08:00'],
  start_date: new Date().toISOString().split('T')[0],
  end_date: '', prescribed_by: '', purpose: '',
  side_effects_to_watch: '', notes: '',
}

export default function MedicationsPage() {
  const [medications, setMedications]   = useState<Medication[]>([])
  const [logs, setLogs]                 = useState<Record<string, MedicationLog[]>>({})
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState(defaultForm)
  const [saving, setSaving]             = useState(false)
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [activeTab, setActiveTab]       = useState<'active'|'history'>('active')
  const [editingId, setEditingId]       = useState<string | null>(null)

  const fetchMedications = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('medications').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setMedications(data || [])

    // Fetch today's logs for active meds
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const { data: todayLogs } = await supabase.from('medication_logs').select('*')
      .eq('user_id', user.id).gte('taken_at', todayStart.toISOString())
    const logMap: Record<string, MedicationLog[]> = {}
    ;(todayLogs || []).forEach((l: MedicationLog) => {
      if (!logMap[l.medication_id]) logMap[l.medication_id] = []
      logMap[l.medication_id].push(l)
    })
    setLogs(logMap)
    setLoading(false)
  }, [])

  useEffect(() => { fetchMedications() }, [fetchMedications])

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const addTime = () => {
    if (form.times.length >= 4) { toast('Maximum 4 times per day'); return }
    setForm(prev => ({ ...prev, times: [...prev.times, '08:00'] }))
  }
  const removeTime = (i: number) => setForm(prev => ({ ...prev, times: prev.times.filter((_, idx) => idx !== i) }))
  const updateTime = (i: number, val: string) => setForm(prev => ({
    ...prev, times: prev.times.map((t, idx) => idx === i ? val : t)
  }))

  const saveMedication = async () => {
    if (!form.name || !form.dosage) { toast.error('Please add medication name and dosage'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = { ...form, user_id: user.id, active: true }

    if (editingId) {
      await supabase.from('medications').update(payload).eq('id', editingId)
      toast.success('✅ Medication updated!')
    } else {
      const { data: med } = await supabase.from('medications').insert(payload).select().single()
      // Create reminders for each time
      if (med) {
        const reminderInserts = form.times.map(time => {
          const [h, m] = time.split(':').map(Number)
          const due = new Date(); due.setHours(h, m, 0, 0)
          if (due < new Date()) due.setDate(due.getDate() + 1)
          return {
            user_id: user.id, type: 'medication',
            title: `Take ${form.name} — ${form.dosage}`,
            description: form.purpose || `${form.frequency}`,
            due_at: due.toISOString(), recurrence: 'daily',
            priority: 'high', linked_entity_id: med.id,
            linked_entity_type: 'medication',
          }
        })
        await supabase.from('reminders').insert(reminderInserts)
      }
      toast.success('✅ Medication added with daily reminders!')
    }

    setForm(defaultForm)
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    fetchMedications()
  }

  const logTaken = async (medId: string, taken: boolean, sideEffect?: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('medication_logs').insert({
      medication_id: medId, user_id: user.id,
      taken_at: new Date().toISOString(), taken,
      side_effects_noted: sideEffect || null,
    })
    setLogs(prev => ({
      ...prev,
      [medId]: [...(prev[medId] || []), { id: Date.now().toString(), medication_id: medId, user_id: user.id, taken_at: new Date().toISOString(), taken, created_at: new Date().toISOString() }]
    }))
    toast.success(taken ? '✅ Marked as taken!' : '⚠️ Logged as missed')
  }

  const archiveMedication = async (id: string) => {
    const supabase = createClient()
    await supabase.from('medications').update({ active: false }).eq('id', id)
    // Deactivate linked reminders
    await supabase.from('reminders').update({ is_active: false })
      .eq('linked_entity_id', id).eq('linked_entity_type', 'medication')
    fetchMedications()
    toast('Medication archived')
  }

  const reactivate = async (id: string) => {
    const supabase = createClient()
    await supabase.from('medications').update({ active: true }).eq('id', id)
    fetchMedications()
    toast.success('Medication reactivated')
  }

  const startEdit = (med: Medication) => {
    setForm({
      name: med.name, dosage: med.dosage, frequency: med.frequency,
      times: med.times || ['08:00'],
      start_date: med.start_date, end_date: med.end_date || '',
      prescribed_by: med.prescribed_by || '', purpose: med.purpose || '',
      side_effects_to_watch: med.side_effects_to_watch || '', notes: med.notes || '',
    })
    setEditingId(med.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const active   = medications.filter(m => m.active)
  const inactive = medications.filter(m => !m.active)

  // Today's adherence
  const takenToday = active.filter(m => logs[m.id]?.some(l => l.taken)).length
  const adherence  = active.length ? Math.round((takenToday / active.length) * 100) : 0

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Track · Log · Remember</p>
            <h2 className="font-display text-4xl text-gray-900">
              Medications <span className="text-gold-500">Tracker</span>
            </h2>
            <p className="sec-intro">
              Log all your medications, track doses taken, set reminders,
              and record side effects — all in one place.
            </p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultForm) }}
            className="btn-gold flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Medication
          </button>
        </div>

        {/* Today's adherence */}
        {active.length > 0 && (
          <div className="bg-white rounded-2xl border border-gold-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-700 text-sm">Today's Adherence</p>
              <p className="font-bold text-gold-600">{takenToday}/{active.length} taken · {adherence}%</p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${adherence}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-teal-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {adherence === 100 ? '🌟 Perfect today!' : adherence >= 75 ? '💛 Almost there!' : '⚠️ Remember your medications'}
            </p>
          </div>
        )}

        {/* Add/edit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white rounded-3xl border-2 border-gold-200 shadow-gold p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-gold-500" />
                    {editingId ? 'Edit Medication' : 'Add Medication'}
                  </h3>
                  <button onClick={() => { setShowForm(false); setEditingId(null) }}
                    className="p-2 rounded-xl hover:bg-gray-100"><X className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="ccl-label">Medication Name *</label>
                    <input className="ccl-input" value={form.name} onChange={f('name')} placeholder="e.g. Ondansetron" />
                  </div>
                  <div>
                    <label className="ccl-label">Dosage *</label>
                    <input className="ccl-input" value={form.dosage} onChange={f('dosage')} placeholder="e.g. 8mg" />
                  </div>
                  <div>
                    <label className="ccl-label">Frequency</label>
                    <select className="ccl-select" value={form.frequency} onChange={f('frequency')}>
                      {FREQUENCIES.map(freq => <option key={freq}>{freq}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ccl-label">Prescribed By</label>
                    <input className="ccl-input" value={form.prescribed_by} onChange={f('prescribed_by')} placeholder="Dr. Name" />
                  </div>
                  <div>
                    <label className="ccl-label">Purpose / Reason</label>
                    <input className="ccl-input" value={form.purpose} onChange={f('purpose')} placeholder="e.g. Anti-nausea" />
                  </div>
                  <div>
                    <label className="ccl-label">Start Date</label>
                    <input type="date" className="ccl-input" value={form.start_date} onChange={f('start_date')} />
                  </div>
                  <div>
                    <label className="ccl-label">End Date (if known)</label>
                    <input type="date" className="ccl-input" value={form.end_date} onChange={f('end_date')} />
                  </div>
                </div>

                {/* Times */}
                <div className="mt-4">
                  <label className="ccl-label">Reminder Times</label>
                  <div className="flex gap-3 flex-wrap mt-1">
                    {form.times.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-xl px-3 py-2">
                        <select value={t} onChange={e => updateTime(i, e.target.value)}
                          className="border-none bg-transparent text-sm font-bold text-gold-700 outline-none cursor-pointer">
                          {TIMES_OF_DAY.map(time => <option key={time}>{time}</option>)}
                        </select>
                        {form.times.length > 1 && (
                          <button onClick={() => removeTime(i)} className="text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {form.times.length < 4 && (
                      <button onClick={addTime} className="btn-ghost text-xs px-3 py-2">
                        <Plus className="w-3 h-3" /> Add time
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="ccl-label">Side Effects to Watch For</label>
                    <textarea className="ccl-textarea" value={form.side_effects_to_watch}
                      onChange={f('side_effects_to_watch')} placeholder="Warn me about..." />
                  </div>
                  <div>
                    <label className="ccl-label">Special Instructions / Notes</label>
                    <textarea className="ccl-textarea" value={form.notes}
                      onChange={f('notes')} placeholder="Take with food, avoid grapefruit..." />
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={saveMedication} disabled={saving} className="btn-gold">
                    {saving ? 'Saving...' : editingId ? '💾 Update Medication' : '💊 Add + Create Reminders'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-outline">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['active','history'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-5 py-2.5 rounded-full text-sm font-bold transition-all',
                activeTab === tab ? 'bg-gold-500 text-white shadow-gold' : 'bg-white border border-gold-100 text-gray-500')}>
              {tab === 'active' ? `💊 Active (${active.length})` : `📦 History (${inactive.length})`}
            </button>
          ))}
        </div>

        {/* Medication list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : activeTab === 'active' ? (
          active.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gold-100 p-10 text-center">
              <Pill className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-gray-600">No active medications</p>
              <p className="text-sm text-gray-400 mt-1">Add your first medication above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((med, i) => (
                <MedCard
                  key={med.id}
                  med={med}
                  index={i}
                  todayLogs={logs[med.id] || []}
                  expanded={expanded === med.id}
                  onToggle={() => setExpanded(expanded === med.id ? null : med.id)}
                  onTaken={(sideEffect) => logTaken(med.id, true, sideEffect)}
                  onMissed={() => logTaken(med.id, false)}
                  onEdit={() => startEdit(med)}
                  onArchive={() => archiveMedication(med.id)}
                />
              ))}
            </div>
          )
        ) : (
          inactive.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Archive className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 font-semibold">No archived medications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inactive.map((med, i) => (
                <div key={med.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 opacity-70">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-600">{med.name} — {med.dosage}</p>
                    <p className="text-xs text-gray-400">{med.frequency} · Ended {med.end_date ? format(parseISO(med.end_date), 'dd MMM yyyy') : 'N/A'}</p>
                  </div>
                  <button onClick={() => reactivate(med.id)} className="btn-ghost text-xs flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reactivate
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AppShell>
  )
}

// ── Medication Card ────────────────────────────────────────────
function MedCard({ med, index, todayLogs, expanded, onToggle, onTaken, onMissed, onEdit, onArchive }: {
  med: Medication; index: number; todayLogs: MedicationLog[]
  expanded: boolean; onToggle: () => void
  onTaken: (sideEffect?: string) => void; onMissed: () => void
  onEdit: () => void; onArchive: () => void
}) {
  const [showSideEffect, setShowSideEffect] = useState(false)
  const [sideEffectText, setSideEffectText] = useState('')
  const takenToday = todayLogs.filter(l => l.taken).length
  const hasBeenLogged = todayLogs.length > 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border-2 border-gold-100 overflow-hidden hover:border-gold-200 transition-all">

      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
          hasBeenLogged ? 'bg-teal-50 border border-teal-200' : 'bg-gold-50 border border-gold-200')}>
          <Pill className={cn('w-6 h-6', hasBeenLogged ? 'text-teal-500' : 'text-gold-500')} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <p className="font-bold text-gray-800">{med.name}</p>
          <p className="text-sm text-gray-500">{med.dosage} · {med.frequency}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {med.times.map((t, i) => (
              <span key={i} className="text-xs bg-gold-50 text-gold-700 border border-gold-200 px-2 py-0.5 rounded-full font-bold">
                <Clock className="w-2.5 h-2.5 inline mr-1" />{t}
              </span>
            ))}
            {med.purpose && <span className="badge-teal">{med.purpose}</span>}
          </div>
        </div>

        {/* Today's status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasBeenLogged ? (
            <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full',
              takenToday > 0 ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-600')}>
              {takenToday > 0 ? `✅ ${takenToday} taken` : '⚠️ Missed'}
            </span>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => setShowSideEffect(true)}
                className="w-9 h-9 rounded-xl bg-teal-500 hover:bg-teal-600 flex items-center justify-center shadow-teal transition-all"
                title="Mark taken">
                <Check className="w-4 h-4 text-white" />
              </button>
              <button onClick={onMissed}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                title="Mark missed">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
          <button onClick={onToggle} className="p-1">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Side effect prompt */}
      <AnimatePresence>
        {showSideEffect && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-gold-100 bg-gold-50 p-4">
            <p className="text-sm font-bold text-gray-700 mb-2">Any side effects to note?</p>
            <div className="flex gap-2">
              <input className="ccl-input flex-1 py-2 text-sm" value={sideEffectText}
                onChange={e => setSideEffectText(e.target.value)}
                placeholder="Optional — e.g. slight nausea" />
              <button onClick={() => { onTaken(sideEffectText || undefined); setShowSideEffect(false); setSideEffectText('') }}
                className="btn-teal text-sm py-2 px-4">
                ✅ Mark Taken
              </button>
              <button onClick={() => { onTaken(); setShowSideEffect(false) }}
                className="btn-ghost text-sm py-2 px-3">Skip</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {med.prescribed_by && (
                  <div><p className="ccl-label">Prescribed By</p><p className="font-semibold">{med.prescribed_by}</p></div>
                )}
                <div><p className="ccl-label">Start Date</p><p className="font-semibold">{format(parseISO(med.start_date), 'dd MMM yyyy')}</p></div>
                {med.end_date && (
                  <div><p className="ccl-label">End Date</p><p className="font-semibold">{format(parseISO(med.end_date), 'dd MMM yyyy')}</p></div>
                )}
              </div>
              {med.side_effects_to_watch && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-700">Watch for these side effects</p>
                    <p className="text-xs text-red-600 mt-0.5">{med.side_effects_to_watch}</p>
                  </div>
                </div>
              )}
              {med.notes && (
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-gold-700">Special Instructions</p>
                  <p className="text-xs text-gold-600 mt-0.5">{med.notes}</p>
                </div>
              )}
              {/* Today's log history */}
              {todayLogs.length > 0 && (
                <div>
                  <p className="ccl-label mb-1">Today's Log</p>
                  <div className="space-y-1">
                    {todayLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={log.taken ? 'text-teal-500' : 'text-red-400'}>
                          {log.taken ? '✅' : '❌'}
                        </span>
                        <span className="text-gray-500">{format(new Date(log.taken_at), 'HH:mm')}</span>
                        {log.side_effects_noted && <span className="text-orange-500">⚠️ {log.side_effects_noted}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={onEdit} className="btn-ghost text-xs">✏️ Edit</button>
                <button onClick={onArchive} className="btn-ghost text-xs text-red-400 hover:text-red-600">
                  <Archive className="w-3 h-3 inline mr-1" />Archive
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
