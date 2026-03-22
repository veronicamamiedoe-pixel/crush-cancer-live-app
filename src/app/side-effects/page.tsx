'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { Brain, RefreshCw, Flag, ChevronDown, ChevronUp, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import type { SymptomPattern } from '@/types/v2'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const SEVERITY_CONFIG = {
  mild:        { colour: 'text-green-600',  bg: 'bg-green-50 border-green-200',  dot: 'bg-green-500'  },
  moderate:    { colour: 'text-gold-600',   bg: 'bg-gold-50 border-gold-200',    dot: 'bg-gold-500'   },
  significant: { colour: 'text-red-600',    bg: 'bg-red-50 border-red-200',      dot: 'bg-red-500'    },
}

export default function SideEffectsPage() {
  const [patterns, setPatterns]   = useState<SymptomPattern[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  useEffect(() => {
    fetchPatterns()
    fetchSymptomHistory()
  }, [])

  const fetchPatterns = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('ai_insights')
      .select('*').eq('user_id', user.id).eq('dismissed', false)
      .order('last_updated', { ascending: false })
    setPatterns(data || [])
    setLoading(false)
  }

  const fetchSymptomHistory = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase.from('symptoms').select('*')
      .eq('user_id', user.id).gte('logged_at', from).order('logged_at', { ascending: true })

    // Build chart data
    const chart = (data || []).map((l: any) => ({
      date: new Date(l.logged_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      Pain: l.pain_level,
      Fatigue: l.fatigue_level,
      Nausea: l.nausea_level,
      Energy: l.energy_level,
      Mood: (l.mood || 3) * 2,
    }))
    setChartData(chart)

    // Build weekly averages
    const weekly: Record<string, { week: string; pain: number[]; fatigue: number[]; nausea: number[]; energy: number[] }> = {}
    ;(data || []).forEach((l: any) => {
      const d = new Date(l.logged_at)
      const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString('en-GB', { month: 'short' })}`
      if (!weekly[week]) weekly[week] = { week, pain: [], fatigue: [], nausea: [], energy: [] }
      weekly[week].pain.push(l.pain_level)
      weekly[week].fatigue.push(l.fatigue_level)
      weekly[week].nausea.push(l.nausea_level)
      weekly[week].energy.push(l.energy_level)
    })
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0
    setWeeklyData(Object.values(weekly).map(w => ({
      week: w.week,
      'Avg Pain': avg(w.pain),
      'Avg Fatigue': avg(w.fatigue),
      'Avg Nausea': avg(w.nausea),
      'Avg Energy': avg(w.energy),
    })))
  }

  const runAnalysis = async () => {
    setAnalysing(true)
    try {
      const res = await fetch('/api/side-effects/analyse', { method: 'POST' })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      toast.success(`✅ Analysis complete — ${data.count} pattern${data.count !== 1 ? 's' : ''} found`)
      fetchPatterns()
    } catch {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setAnalysing(false)
    }
  }

  const dismissPattern = async (id: string) => {
    const supabase = createClient()
    await supabase.from('ai_insights').update({ dismissed: true }).eq('id', id)
    setPatterns(p => p.filter(x => x.id !== id))
    toast('Pattern dismissed')
  }

  const flagForDoctor = async (id: string) => {
    const supabase = createClient()
    await supabase.from('ai_insights').update({ flagged_for_doctor: true }).eq('id', id)
    setPatterns(p => p.map(x => x.id === id ? { ...x, flagged_for_doctor: true } : x))
    toast.success('🚩 Flagged — this will appear in your next appointment briefing')
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="sec-eyebrow">Premium Feature</p>
              <span className="badge-pink text-xs flex items-center gap-1"><Brain className="w-3 h-3" /> AI-Powered</span>
            </div>
            <h2 className="font-bold text-4xl text-gray-900">Side-Effect <span className="text-pink-500">Intelligence</span></h2>
            <p className="sec-intro">
              AI analyses your symptom history to identify patterns — helping you and your doctor
              understand your treatment journey better.
            </p>
          </div>
          <button onClick={runAnalysis} disabled={analysing} className="btn-primary flex-shrink-0">
            {analysing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Analysing...</>
            ) : (
              <><Brain className="w-4 h-4" /> Run Analysis</>
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-teal-700">
            <strong>Important:</strong> This feature identifies patterns in your logged data only.
            It does <strong>not</strong> provide medical advice, diagnoses, or treatment recommendations.
            Always discuss patterns with your oncologist or medical team.
          </p>
        </div>

        {/* Pattern cards */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : patterns.length === 0 ? (
          <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center">
            <Brain className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">No patterns identified yet</p>
            <p className="text-sm text-gray-400 mt-1">Log at least 7 days of symptoms, then run the analysis.</p>
            <button onClick={runAnalysis} disabled={analysing} className="btn-primary mt-4">
              <Brain className="w-4 h-4" /> Analyse My Symptoms
            </button>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3">
              {patterns.length} Pattern{patterns.length !== 1 ? 's' : ''} Identified
            </h3>
            <div className="space-y-3">
              {patterns.map(pattern => {
                const sev = SEVERITY_CONFIG[pattern.severity]
                const isOpen = expanded === pattern.id
                return (
                  <motion.div key={pattern.id} layout
                    className={cn('bg-white rounded-2xl border-2 overflow-hidden', sev.bg)}>
                    <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : pattern.id)}>
                      <div className={cn('w-3 h-3 rounded-full flex-shrink-0 mt-1', sev.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-800">{pattern.title}</p>
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full capitalize border', sev.bg, sev.colour)}>
                            {pattern.severity}
                          </span>
                          {pattern.flagged_for_doctor && (
                            <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-bold">🚩 Flagged for doctor</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pattern.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span>Confidence: {pattern.confidence}%</span>
                          <span>Based on {pattern.data_points} data points</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isOpen && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="border-t border-gray-100 p-4 bg-white space-y-4">
                        <p className="text-sm text-gray-700">{pattern.description}</p>
                        {pattern.symptom_keys?.length > 0 && (
                          <div>
                            <p className="ccl-label mb-2">Symptoms involved</p>
                            <div className="flex gap-2 flex-wrap">
                              {pattern.symptom_keys.map(k => <span key={k} className="badge-pink capitalize">{k.replace('_', ' ')}</span>)}
                            </div>
                          </div>
                        )}
                        {pattern.treatment_types?.length > 0 && (
                          <div>
                            <p className="ccl-label mb-2">Related treatments</p>
                            <div className="flex gap-2 flex-wrap">
                              {pattern.treatment_types.map(t => <span key={t} className="badge-teal capitalize">{t}</span>)}
                            </div>
                          </div>
                        )}
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                          <p className="text-xs font-bold text-teal-700">💡 Recommended action</p>
                          <p className="text-xs text-teal-600 mt-1">Please discuss this pattern with your oncologist at your next appointment. You can flag it below to include it in your appointment briefing.</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {!pattern.flagged_for_doctor && (
                            <button onClick={() => flagForDoctor(pattern.id)} className="btn-pink btn-sm flex items-center gap-1 text-xs">
                              <Flag className="w-3 h-3" /> Flag for doctor
                            </button>
                          )}
                          <button onClick={() => dismissPattern(pattern.id)} className="btn-ghost btn-sm text-xs">Dismiss</button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-pink-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-pink-500" /> 30-Day Symptom Trends
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce8f3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="Pain"    stroke="#E8196A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Fatigue" stroke="#F5A623" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Nausea"  stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Energy"  stroke="#1A9EA0" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {weeklyData.length > 0 && (
              <div className="bg-white rounded-3xl border border-pink-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" /> Weekly Averages
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce8f3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="Avg Pain"    fill="#E8196A" radius={[4,4,0,0]} />
                    <Bar dataKey="Avg Fatigue" fill="#F5A623" radius={[4,4,0,0]} />
                    <Bar dataKey="Avg Energy"  fill="#1A9EA0" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
