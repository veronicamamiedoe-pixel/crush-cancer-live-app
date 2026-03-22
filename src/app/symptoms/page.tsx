'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts'
import { Plus, Flag, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'
import type { SymptomLog } from '@/types'
import toast from 'react-hot-toast'

const SYMPTOMS = [
  { key: 'pain_level',    label: 'Pain',      color: '#E8196A', emoji: '🔴', invert: false },
  { key: 'fatigue_level', label: 'Fatigue',   color: '#F5A623', emoji: '😴', invert: false },
  { key: 'nausea_level',  label: 'Nausea',    color: '#8B5CF6', emoji: '🤢', invert: false },
  { key: 'appetite_level',label: 'Appetite',  color: '#10B981', emoji: '🍽', invert: true },
  { key: 'sleep_quality', label: 'Sleep',     color: '#3B82F6', emoji: '💤', invert: true },
  { key: 'energy_level',  label: 'Energy',    color: '#1A9EA0', emoji: '⚡', invert: true },
  { key: 'anxiety_level', label: 'Anxiety',   color: '#EC4899', emoji: '😰', invert: false },
  { key: 'mood',          label: 'Mood',      color: '#F59E0B', emoji: '😊', invert: true },
]

const defaultLog = {
  pain_level: 1, fatigue_level: 1, nausea_level: 1,
  appetite_level: 7, sleep_quality: 7, energy_level: 7,
  anxiety_level: 1, mood: 4, notes: '', flagged_for_doctor: false
}

export default function SymptomsPage() {
  const [logs, setLogs] = useState<SymptomLog[]>([])
  const [form, setForm] = useState(defaultLog)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [range, setRange] = useState<7|14|30>(14)

  useEffect(() => { fetchLogs() }, [range])

  const fetchLogs = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const from = subDays(new Date(), range).toISOString()
    const { data } = await supabase.from('symptoms')
      .select('*').eq('user_id', user.id).gte('logged_at', from)
      .order('logged_at', { ascending: true })
    setLogs(data || [])
  }

  const saveLog = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('symptoms')
      .insert({ ...form, user_id: user.id, logged_at: new Date().toISOString() })
    if (error) { toast.error('Could not save. Please try again.'); setSaving(false); return }
    toast.success('✅ Symptoms logged!')
    setForm(defaultLog)
    setShowForm(false)
    setSaving(false)
    fetchLogs()
  }

  const chartData = logs.map(l => ({
    date: format(new Date(l.logged_at), 'dd MMM'),
    Pain: l.pain_level,
    Fatigue: l.fatigue_level,
    Nausea: l.nausea_level,
    Energy: l.energy_level,
    Mood: (l.mood || 3) * 2,
    Sleep: l.sleep_quality,
  }))

  const latestLog = logs[logs.length - 1]
  const radarData = latestLog ? SYMPTOMS.map(s => ({
    symptom: s.label,
    value: (latestLog as any)[s.key] || 5,
  })) : []

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Track · Understand · Report</p>
            <h2 className="font-bold text-4xl text-gray-900">Symptom <span className="text-pink-500">Tracker</span></h2>
            <p className="sec-intro">Log how you feel each day. Spot patterns and share reports with your doctor.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Log Symptoms
          </button>
        </div>

        {/* Log form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="ccl-card ccl-card-pink p-6"
          >
            <h3 className="font-bold text-lg text-gray-800 mb-5">📝 How are you feeling right now?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SYMPTOMS.map(s => (
                <div key={s.key}>
                  <label className="ccl-label">{s.emoji} {s.label} — {(form as any)[s.key]}/10</label>
                  <input
                    type="range" min="1" max={s.key === 'mood' ? '5' : '10'}
                    value={(form as any)[s.key]}
                    onChange={e => setForm(f => ({ ...f, [s.key]: Number(e.target.value) }))}
                    className="w-full accent-pink-500 cursor-pointer"
                    style={{ accentColor: s.color }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>{s.invert ? 'Low' : 'None'}</span>
                    <span>{s.invert ? 'High' : 'Severe'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <label className="ccl-label">Notes for today</label>
              <textarea
                className="ccl-textarea"
                placeholder="Any additional observations, changes, or things to discuss with your doctor..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.flagged_for_doctor}
                  onChange={e => setForm(f => ({ ...f, flagged_for_doctor: e.target.checked }))}
                  className="accent-pink-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Flag className="w-4 h-4 text-pink-500" />
                  Flag this for my doctor
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={saveLog} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : '💾 Save Symptoms'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Flagged alert */}
        {logs.some(l => l.flagged_for_doctor) && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-700">You have flagged symptoms for your doctor</p>
              <p className="text-xs text-red-600 mt-0.5">
                {logs.filter(l => l.flagged_for_doctor).length} log(s) marked. Bring these to your next appointment.
              </p>
            </div>
          </div>
        )}

        {/* Range selector */}
        <div className="flex gap-2">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                range === r
                  ? 'bg-pink-500 text-white shadow-pink'
                  : 'bg-white border border-pink-100 text-gray-500 hover:border-pink-300'
              }`}
            >
              {r} days
            </button>
          ))}
        </div>

        {/* Charts */}
        {logs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Line chart */}
            <div className="lg:col-span-2 ccl-card p-6">
              <h3 className="font-bold text-gray-800 mb-4">📈 Trends Over {range} Days</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce8f3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #fac8dc', fontFamily: 'Nunito' }} />
                  <Legend />
                  <Line type="monotone" dataKey="Pain"    stroke="#E8196A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Fatigue" stroke="#F5A623" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Energy"  stroke="#1A9EA0" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Mood"    stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Radar — latest snapshot */}
            <div className="ccl-card p-6">
              <h3 className="font-bold text-gray-800 mb-4">🎯 Today's Snapshot</h3>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#fce8f3" />
                    <PolarAngleAxis dataKey="symptom" tick={{ fontSize: 10 }} />
                    <Radar name="You" dataKey="value" stroke="#E8196A" fill="#E8196A" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center mt-12">Log symptoms to see snapshot</p>
              )}
            </div>
          </div>
        ) : (
          <div className="ccl-card p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-bold text-gray-700">No symptom logs yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Log Symptoms" to start tracking your daily wellbeing.</p>
          </div>
        )}

        {/* Recent logs table */}
        {logs.length > 0 && (
          <div className="ccl-card p-6">
            <h3 className="font-bold text-gray-800 mb-4">📋 Recent Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pink-100">
                    <th className="text-left py-2 px-3 ccl-label">Date</th>
                    {SYMPTOMS.slice(0, 5).map(s => (
                      <th key={s.key} className="text-center py-2 px-3 ccl-label">{s.emoji}</th>
                    ))}
                    <th className="text-center py-2 px-3 ccl-label">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {[...logs].reverse().slice(0, 10).map(log => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-pink-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-gray-700">
                        {format(new Date(log.logged_at), 'dd MMM, HH:mm')}
                      </td>
                      {SYMPTOMS.slice(0, 5).map(s => (
                        <td key={s.key} className="py-2.5 px-3 text-center">
                          <ScoreBadge value={(log as any)[s.key]} invert={s.invert} />
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-center">
                        {log.flagged_for_doctor && <span className="text-red-500">🚩</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

function ScoreBadge({ value, invert }: { value: number; invert: boolean }) {
  const isGood = invert ? value >= 7 : value <= 3
  const isBad  = invert ? value <= 3 : value >= 7
  return (
    <span className={`inline-block w-8 h-6 rounded text-xs font-bold leading-6 text-center ${
      isGood ? 'bg-green-100 text-green-700' :
      isBad  ? 'bg-red-100 text-red-600'    :
               'bg-yellow-100 text-yellow-700'
    }`}>
      {value}
    </span>
  )
}
