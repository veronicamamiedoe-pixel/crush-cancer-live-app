'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Plus, Check, Clock, Snooze, Filter,
  Pill, Calendar, Activity, Droplets, Utensils,
  FileText, Music, AlertTriangle, ChevronDown, ChevronUp, X
} from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, isTomorrow, isThisWeek, isPast, addMinutes, parseISO } from 'date-fns'
import type { Reminder, ReminderType } from '@/types/v2'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// ── type config ────────────────────────────────────────────────
const TYPE_CONFIG: Record<ReminderType, { label: string; icon: any; colour: string; bg: string }> = {
  medication:       { label: 'Medication',       icon: Pill,          colour: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200'   },
  appointment:      { label: 'Appointment',      icon: Calendar,      colour: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200'   },
  treatment:        { label: 'Treatment',        icon: Activity,      colour: 'text-purple-600', bg: 'bg-purple-50 border-purple-200'},
  symptom_log:      { label: 'Symptom Log',      icon: Activity,      colour: 'text-orange-600', bg: 'bg-orange-50 border-orange-200'},
  hydration:        { label: 'Hydration',        icon: Droplets,      colour: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200'   },
  nutrition:        { label: 'Nutrition',        icon: Utensils,      colour: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  follow_up:        { label: 'Follow-up',        icon: Check,         colour: 'text-gold-600',   bg: 'bg-gold-50 border-gold-200'   },
  document_upload:  { label: 'Upload Document',  icon: FileText,      colour: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200'   },
  appointment_prep: { label: 'Appt. Prep',       icon: Calendar,      colour: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200'   },
  audio_session:    { label: 'Audio Session',    icon: Music,         colour: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200'   },
  custom:           { label: 'Custom',           icon: Bell,          colour: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200'   },
}

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    colour: 'text-gray-500',  bg: 'bg-gray-100'  },
  normal: { label: 'Normal', colour: 'text-teal-600',  bg: 'bg-teal-50'   },
  high:   { label: 'High',   colour: 'text-gold-600',  bg: 'bg-gold-50'   },
  urgent: { label: 'Urgent', colour: 'text-red-600',   bg: 'bg-red-50'    },
}

type TimeFilter = 'overdue' | 'today' | 'week' | 'upcoming' | 'all'

export default function RemindersPage() {
  const [reminders, setReminders]     = useState<Reminder[]>([])
  const [loading, setLoading]         = useState(true)
  const [timeFilter, setTimeFilter]   = useState<TimeFilter>('today')
  const [typeFilter, setTypeFilter]   = useState<ReminderType | 'all'>('all')
  const [showAdd, setShowAdd]         = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchReminders = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('due_at', { ascending: true })
    setReminders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  const markComplete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').update({
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', id)
    setReminders(r => r.map(x => x.id === id ? { ...x, completed: true } : x))
    toast.success('✅ Reminder completed!')
  }

  const snooze = async (id: string, minutes: number) => {
    const supabase = createClient()
    const until = addMinutes(new Date(), minutes).toISOString()
    await supabase.from('reminders').update({
      snoozed_until: until,
      snooze_count: reminders.find(r => r.id === id)!.snooze_count + 1,
    }).eq('id', id)
    setReminders(r => r.map(x => x.id === id ? { ...x, snoozed_until: until } : x))
    toast(`⏰ Snoozed for ${minutes} minutes`)
  }

  const deleteReminder = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').update({ is_active: false }).eq('id', id)
    setReminders(r => r.filter(x => x.id !== id))
    toast('🗑 Reminder removed')
  }

  // ── filter logic ──────────────────────────────────────────
  const now = new Date()
  const filtered = reminders.filter(r => {
    if (r.completed) return false
    if (r.snoozed_until && new Date(r.snoozed_until) > now) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    const due = parseISO(r.due_at)
    if (timeFilter === 'overdue')  return isPast(due)
    if (timeFilter === 'today')    return isToday(due) || isPast(due)
    if (timeFilter === 'week')     return isThisWeek(due, { weekStartsOn: 1 })
    if (timeFilter === 'upcoming') return !isPast(due)
    return true
  })

  const overdue = reminders.filter(r => !r.completed && isPast(parseISO(r.due_at)) &&
    (!r.snoozed_until || new Date(r.snoozed_until) < now)).length

  const completed = reminders.filter(r => r.completed &&
    isToday(parseISO(r.completed_at || r.due_at))).length

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="sec-eyebrow">Your Daily Command Centre</p>
            <h2 className="font-display text-4xl text-gray-900">
              Reminders <span className="text-pink-500">&amp; Tasks</span>
            </h2>
            <p className="sec-intro">Everything you need to do — all in one calm, organised place.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Overdue',        value: overdue,                             colour: overdue > 0 ? 'text-red-500'   : 'text-gray-400', bg: overdue > 0 ? 'bg-red-50'   : 'bg-gray-50' },
            { label: 'Due Today',      value: reminders.filter(r => !r.completed && isToday(parseISO(r.due_at))).length, colour: 'text-pink-500',  bg: 'bg-pink-50'  },
            { label: 'This Week',      value: reminders.filter(r => !r.completed && isThisWeek(parseISO(r.due_at), { weekStartsOn: 1 })).length, colour: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Done Today',     value: completed,                           colour: 'text-green-600', bg: 'bg-green-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-4 border border-opacity-30`}>
              <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {overdue > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              You have {overdue} overdue reminder{overdue !== 1 ? 's' : ''}. Take care of these first. 💛
            </p>
          </motion.div>
        )}

        {/* Time filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'overdue',  label: `Overdue (${overdue})` },
            { id: 'today',    label: 'Today' },
            { id: 'week',     label: 'This Week' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'all',      label: 'All Active' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setTimeFilter(f.id)}
              className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all',
                timeFilter === f.id
                  ? 'bg-pink-500 text-white shadow-pink'
                  : 'bg-white border border-pink-100 text-gray-500 hover:border-pink-300'
              )}>
              {f.label}
            </button>
          ))}
          <button onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-gray-200 text-gray-500 hover:border-gray-300 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter
          </button>
        </div>

        {/* Type filter */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="flex gap-2 flex-wrap">
              <button onClick={() => setTypeFilter('all')}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  typeFilter === 'all' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 text-gray-500')}>
                All Types
              </button>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button key={type} onClick={() => setTypeFilter(type as ReminderType)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all',
                      typeFilter === type ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 text-gray-500')}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminder list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">No reminders in this view</p>
            <p className="text-sm text-gray-400 mt-1">
              {timeFilter === 'overdue' ? "You're all caught up! 🎉" : 'All clear for now.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((reminder, i) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                index={i}
                onComplete={markComplete}
                onSnooze={snooze}
                onDelete={deleteReminder}
              />
            ))}
          </div>
        )}

        {/* Completed today (collapsed) */}
        {completed > 0 && (
          <CompletedToday reminders={reminders.filter(r =>
            r.completed && isToday(parseISO(r.completed_at || r.due_at))
          )} />
        )}
      </div>

      {/* Add reminder modal */}
      <AnimatePresence>
        {showAdd && (
          <AddReminderModal onClose={() => setShowAdd(false)} onSaved={() => { fetchReminders(); setShowAdd(false) }} />
        )}
      </AnimatePresence>
    </AppShell>
  )
}

// ── Reminder Card ──────────────────────────────────────────────
function ReminderCard({
  reminder, index, onComplete, onSnooze, onDelete
}: {
  reminder: Reminder
  index: number
  onComplete: (id: string) => void
  onSnooze: (id: string, mins: number) => void
  onDelete: (id: string) => void
}) {
  const [showSnooze, setShowSnooze] = useState(false)
  const cfg = TYPE_CONFIG[reminder.type]
  const pri = PRIORITY_CONFIG[reminder.priority]
  const due = parseISO(reminder.due_at)
  const isOverdue = isPast(due)
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'bg-white rounded-2xl border-2 p-4 flex items-start gap-3 transition-all',
        isOverdue ? 'border-red-200 bg-red-50/30' : 'border-pink-100 hover:border-pink-200'
      )}
    >
      {/* Type icon */}
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', cfg.bg)}>
        <Icon className={cn('w-5 h-5', cfg.colour)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="font-bold text-sm text-gray-800">{reminder.title}</p>
          {reminder.priority !== 'normal' && (
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', pri.bg, pri.colour)}>
              {pri.label}
            </span>
          )}
          {reminder.play_audio_after && (
            <span className="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              🎵 Audio after
            </span>
          )}
        </div>
        {reminder.description && (
          <p className="text-xs text-gray-500 mt-0.5">{reminder.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className={cn('text-xs font-bold flex items-center gap-1', isOverdue ? 'text-red-500' : 'text-gray-400')}>
            <Clock className="w-3 h-3" />
            {isOverdue
              ? `Overdue — was ${format(due, 'dd MMM, HH:mm')}`
              : isToday(due)
                ? `Today at ${format(due, 'HH:mm')}`
                : isTomorrow(due)
                  ? `Tomorrow at ${format(due, 'HH:mm')}`
                  : format(due, 'dd MMM, HH:mm')
            }
          </span>
          {reminder.recurrence !== 'none' && (
            <span className="text-xs text-teal-500 font-bold capitalize">↻ {reminder.recurrence}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Snooze dropdown */}
        <div className="relative">
          <button onClick={() => setShowSnooze(!showSnooze)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
            title="Snooze">
            <Clock className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showSnooze && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-modal border border-gray-100 py-1 z-20">
                {[[15,'15 min'],[30,'30 min'],[60,'1 hour'],[120,'2 hours'],[480,'8 hours']].map(([mins, label]) => (
                  <button key={mins} onClick={() => { onSnooze(reminder.id, mins as number); setShowSnooze(false) }}
                    className="block w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Complete */}
        <button onClick={() => onComplete(reminder.id)}
          className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 transition-colors" title="Mark done">
          <Check className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button onClick={() => onDelete(reminder.id)}
          className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Remove">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ── Completed Today section ────────────────────────────────────
function CompletedToday({ reminders }: { reminders: Reminder[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-teal-700 font-bold text-sm">
        <span className="flex items-center gap-2"><Check className="w-4 h-4" /> {reminders.length} completed today 🎉</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {reminders.map(r => (
            <div key={r.id} className="flex items-center gap-2 text-sm text-teal-700 opacity-70">
              <Check className="w-3 h-3" />
              <span className="line-through">{r.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Add Reminder Modal ─────────────────────────────────────────
function AddReminderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    type: 'medication' as ReminderType, title: '', description: '',
    due_at: '', recurrence: 'none', priority: 'normal',
    play_audio_after: false,
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.title || !form.due_at) { toast.error('Please add a title and time'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('reminders').insert({ ...form, user_id: user.id })
    if (error) { toast.error('Could not save'); setSaving(false); return }
    toast.success('🔔 Reminder added!')
    setSaving(false)
    onSaved()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-modal border border-pink-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-gray-800">🔔 Add New Reminder</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="ccl-label">Reminder Type</label>
            <select className="ccl-select" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as ReminderType }))}>
              {Object.entries(TYPE_CONFIG).map(([t, c]) => (
                <option key={t} value={t}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ccl-label">Title</label>
            <input className="ccl-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Take morning medication" />
          </div>
          <div>
            <label className="ccl-label">Description (optional)</label>
            <input className="ccl-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any extra details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ccl-label">Date &amp; Time</label>
              <input type="datetime-local" className="ccl-input" value={form.due_at}
                onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))} />
            </div>
            <div>
              <label className="ccl-label">Repeat</label>
              <select className="ccl-select" value={form.recurrence}
                onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="twice_daily">Twice daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Weekdays only</option>
              </select>
            </div>
            <div>
              <label className="ccl-label">Priority</label>
              <select className="ccl-select" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.play_audio_after}
              onChange={e => setForm(f => ({ ...f, play_audio_after: e.target.checked }))}
              className="w-4 h-4 accent-teal-500" />
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              🎵 Play audio session after this reminder
            </span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? 'Saving...' : '🔔 Add Reminder'}
          </button>
          <button onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
