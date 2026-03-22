'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Droplets, Apple, Moon, Dumbbell, X } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const MEAL_TYPES = ['breakfast','lunch','dinner','snack','supplement']
const MEAL_ICONS: Record<string,string> = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍎', supplement:'💊' }

export default function NutritionPage() {
  const [logs, setLogs]           = useState<any[]>([])
  const [wellnessLogs, setWellness] = useState<any[]>([])
  const [showMeal, setShowMeal]   = useState(false)
  const [showWellness, setShowWellness] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [meal, setMeal] = useState({ meal_type: 'breakfast', food_items: '', water_ml: 0, appetite_score: 7, nausea_after: false, notes: '' })
  const [wellness, setWellness2] = useState({ water_ml: 0, sleep_hours: 7, sleep_quality: 7, exercise_type: '', exercise_mins: 0, rest_mins: 0, supplements: '', energy_level: 7, wellness_notes: '' })

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const from = subDays(new Date(), 14).toISOString()
    const [{ data: mealData }, { data: wellData }] = await Promise.all([
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_at', from).order('logged_at', { ascending: false }),
      supabase.from('wellness_logs').select('*').eq('user_id', user.id).gte('logged_at', from).order('logged_at', { ascending: false }),
    ])
    setLogs(mealData || [])
    setWellness(wellData || [])
    setLoading(false)
  }

  const saveMeal = async () => {
    if (!meal.food_items) { toast.error('Please add food items'); return }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('nutrition_logs').insert({ ...meal, user_id: user.id, logged_at: new Date().toISOString() })
    toast.success('🍽 Meal logged!')
    setMeal({ meal_type: 'breakfast', food_items: '', water_ml: 0, appetite_score: 7, nausea_after: false, notes: '' })
    setShowMeal(false)
    fetchLogs()
  }

  const saveWellness = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('wellness_logs').insert({ ...wellness, user_id: user.id, logged_at: new Date().toISOString() })
    toast.success('✅ Wellness logged!')
    setShowWellness(false)
    fetchLogs()
  }

  // Chart data
  const chartData = wellnessLogs.slice(0, 14).reverse().map(l => ({
    date: format(new Date(l.logged_at), 'dd MMM'),
    Sleep: l.sleep_quality || 0,
    Energy: l.energy_level || 0,
    Water: Math.round((l.water_ml || 0) / 250), // glasses
  }))

  const todayMeals = logs.filter(l => {
    const d = new Date(l.logged_at)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
  })

  const totalWaterToday = todayMeals.reduce((n, l) => n + (l.water_ml || 0), 0) +
    wellnessLogs.filter(l => { const d = new Date(l.logged_at); const now = new Date(); return d.getDate() === now.getDate() })[0]?.water_ml || 0

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Nourish · Hydrate · Rest</p>
            <h2 className="font-bold text-4xl text-gray-900">Nutrition <span className="text-green-600">&amp; Wellness</span></h2>
            <p className="sec-intro">Track meals, hydration, sleep, and movement to support your healing.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowMeal(true)} className="btn-primary text-sm"><Apple className="w-4 h-4" /> Log Meal</button>
            <button onClick={() => setShowWellness(true)} className="btn-teal text-sm"><Droplets className="w-4 h-4" /> Log Wellness</button>
          </div>
        </div>

        {/* Today's summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Meals Today',    value: todayMeals.length,              colour: 'text-green-600',  bg: 'bg-green-50', icon: '🍽' },
            { label: 'Water Today',    value: Math.round(totalWaterToday / 250) + ' glasses', colour: 'text-blue-600', bg: 'bg-blue-50', icon: '💧' },
            { label: 'Last Sleep',     value: (wellnessLogs[0]?.sleep_hours || '—') + ' hrs', colour: 'text-purple-600', bg: 'bg-purple-50', icon: '🌙' },
            { label: 'Last Energy',    value: (wellnessLogs[0]?.energy_level || '—') + '/10', colour: 'text-gold-600',   bg: 'bg-gold-50', icon: '⚡' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-4 border border-opacity-30`}>
              <span className="text-2xl">{s.icon}</span>
              <p className={`text-2xl font-bold mt-1 ${s.colour}`}>{s.value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Meal form */}
        {showMeal && (
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} className="overflow-hidden">
            <div className="bg-white rounded-3xl border-2 border-green-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">🍽 Log a Meal</h3>
                <button onClick={() => setShowMeal(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {MEAL_TYPES.map(t => (
                  <button key={t} onClick={() => setMeal(m => ({ ...m, meal_type: t }))}
                    className={`p-3 rounded-xl border-2 capitalize text-sm font-bold transition-all ${meal.meal_type === t ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    {MEAL_ICONS[t]} {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="ccl-label">What did you eat? *</label>
                  <textarea className="ccl-textarea" value={meal.food_items} onChange={e => setMeal(m => ({ ...m, food_items: e.target.value }))} placeholder="e.g. Scrambled eggs, toast, orange juice" />
                </div>
                <div>
                  <label className="ccl-label">Water with this meal (ml)</label>
                  <input type="number" className="ccl-input" value={meal.water_ml} onChange={e => setMeal(m => ({ ...m, water_ml: Number(e.target.value) }))} />
                  <label className="ccl-label mt-2">Appetite Score — {meal.appetite_score}/10</label>
                  <input type="range" min="1" max="10" value={meal.appetite_score} onChange={e => setMeal(m => ({ ...m, appetite_score: Number(e.target.value) }))} className="w-full accent-green-500 mt-1" />
                  <label className="flex items-center gap-2 mt-3 cursor-pointer text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={meal.nausea_after} onChange={e => setMeal(m => ({ ...m, nausea_after: e.target.checked }))} className="accent-orange-500" />
                    Experienced nausea after this meal
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={saveMeal} className="btn-primary">🍽 Save Meal</button>
                <button onClick={() => setShowMeal(false)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wellness form */}
        {showWellness && (
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} className="overflow-hidden">
            <div className="bg-white rounded-3xl border-2 border-teal-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">✨ Log Wellness</h3>
                <button onClick={() => setShowWellness(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="ccl-label">Total Water Today (ml)</label>
                  <input type="number" className="ccl-input" value={wellness.water_ml} onChange={e => setWellness2(w => ({ ...w, water_ml: Number(e.target.value) }))} placeholder="e.g. 2000" />
                  <label className="ccl-label mt-2">Hours Slept</label>
                  <input type="number" className="ccl-input" value={wellness.sleep_hours} step="0.5" onChange={e => setWellness2(w => ({ ...w, sleep_hours: Number(e.target.value) }))} />
                  <label className="ccl-label mt-2">Sleep Quality — {wellness.sleep_quality}/10</label>
                  <input type="range" min="1" max="10" value={wellness.sleep_quality} onChange={e => setWellness2(w => ({ ...w, sleep_quality: Number(e.target.value) }))} className="w-full accent-purple-500 mt-1" />
                </div>
                <div>
                  <label className="ccl-label">Exercise Type</label>
                  <input className="ccl-input" value={wellness.exercise_type} onChange={e => setWellness2(w => ({ ...w, exercise_type: e.target.value }))} placeholder="e.g. Short walk, gentle yoga" />
                  <label className="ccl-label mt-2">Exercise (minutes)</label>
                  <input type="number" className="ccl-input" value={wellness.exercise_mins} onChange={e => setWellness2(w => ({ ...w, exercise_mins: Number(e.target.value) }))} />
                  <label className="ccl-label mt-2">Energy Level — {wellness.energy_level}/10</label>
                  <input type="range" min="1" max="10" value={wellness.energy_level} onChange={e => setWellness2(w => ({ ...w, energy_level: Number(e.target.value) }))} className="w-full accent-gold-500 mt-1" />
                  <label className="ccl-label mt-2">Supplements Taken</label>
                  <input className="ccl-input" value={wellness.supplements} onChange={e => setWellness2(w => ({ ...w, supplements: e.target.value }))} placeholder="e.g. Vitamin D, Omega-3" />
                </div>
                <div className="sm:col-span-2">
                  <label className="ccl-label">Wellness Notes</label>
                  <textarea className="ccl-textarea" value={wellness.wellness_notes} onChange={e => setWellness2(w => ({ ...w, wellness_notes: e.target.value }))} placeholder="How do you feel today overall?" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={saveWellness} className="btn-teal">💚 Save Wellness</button>
                <button onClick={() => setShowWellness(false)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-3xl border border-green-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">📈 14-Day Wellness Trends</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5F5E4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="Sleep"  stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Energy" stroke="#F5A623" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Water"  stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent meals */}
        {logs.length > 0 && (
          <div className="bg-white rounded-3xl border border-green-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">🍽 Recent Meal Logs</h3>
            <div className="space-y-2">
              {logs.slice(0, 10).map(l => (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xl">{MEAL_ICONS[l.meal_type] || '🍽'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800 capitalize">{l.meal_type}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{l.food_items}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{format(new Date(l.logged_at), 'dd MMM HH:mm')}</p>
                    {l.nausea_after && <span className="text-xs text-orange-500">⚠️ Nausea</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
