'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Download, Mail, Printer, Share2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import type { AppointmentBriefing } from '@/types/v2'
import toast from 'react-hot-toast'

export default function PrepareAppointmentPage() {
  const [briefing, setBriefing]     = useState<AppointmentBriefing | null>(null)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [nextAppt, setNextAppt]     = useState<any>(null)
  const [sections, setSections]     = useState({
    lastVisit: true, symptoms: true, medications: true,
    treatments: true, concerns: true, questions: true,
  })

  useEffect(() => {
    fetchLatestBriefing()
    fetchNextAppointment()
  }, [])

  const fetchLatestBriefing = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('appointment_briefings').select('*')
      .eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1).single()
    setBriefing(data)
    setLoading(false)
  }

  const fetchNextAppointment = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('appointments').select('*')
      .eq('user_id', user.id).gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true }).limit(1).single()
    setNextAppt(data)
  }

  const generateBriefing = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/prepare-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: nextAppt?.id }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setBriefing(data.briefing)
      toast.success('✅ Appointment briefing generated!')
    } catch {
      toast.error('Could not generate briefing. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const shareWithDoctor = async () => {
    const res = await fetch('/api/share-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_type: 'appointment_briefing',
        title: `Appointment Briefing — ${new Date().toLocaleDateString('en-GB')}`,
        included_sections: sections,
      }),
    })
    const data = await res.json()
    if (data.shareToken) {
      const url = `${window.location.origin}/shared/${data.shareToken}`
      await navigator.clipboard.writeText(url).catch(() => {})
      toast.success('🔗 Shareable link copied to clipboard!')
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="sec-eyebrow">Premium Feature</p>
            <span className="badge-pink flex items-center gap-1 text-xs"><Brain className="w-3 h-3" /> AI-Powered</span>
          </div>
          <h2 className="font-display text-4xl text-gray-900">Prepare for <span className="text-teal-500">Your Appointment</span></h2>
          <p className="sec-intro">
            AI generates a personalised briefing using your symptom history, medications,
            treatment records, and doctor visit notes — so you walk into every appointment fully prepared.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            This briefing is generated from <strong>your own logged data</strong> to help you communicate
            effectively with your doctor. It is not medical advice. Your medical team makes all clinical decisions.
          </p>
        </div>

        {/* Next appointment */}
        {nextAppt && (
          <div className="bg-white rounded-2xl border-2 border-teal-200 p-4 flex items-center gap-4">
            <div className="bg-teal-500 text-white rounded-2xl px-4 py-3 text-center flex-shrink-0">
              <p className="text-2xl font-bold leading-none">{new Date(nextAppt.date).getDate()}</p>
              <p className="text-xs font-bold uppercase">{new Date(nextAppt.date).toLocaleString('en-GB', { month: 'short' })}</p>
            </div>
            <div>
              <p className="font-bold text-gray-800">{nextAppt.title}</p>
              <p className="text-sm text-gray-500">{nextAppt.doctor || 'Doctor TBC'} · {nextAppt.location || 'Location TBC'}</p>
            </div>
          </div>
        )}

        {/* Generate button */}
        <button onClick={generateBriefing} disabled={generating}
          className="btn-primary w-full py-4 text-base justify-center">
          {generating ? (
            <><RefreshCw className="w-5 h-5 animate-spin" /> Generating your briefing...</>
          ) : (
            <><Brain className="w-5 h-5" /> {briefing ? 'Regenerate Briefing' : 'Generate Appointment Briefing'}</>
          )}
        </button>

        {/* Briefing output */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : briefing ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* AI briefing overview */}
            {briefing.ai_briefing_text && (
              <div className="bg-ccl-hero rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-black/10 rounded-3xl" />
                <p className="text-xs font-bold uppercase tracking-widest text-gold-300 mb-2 relative">AI-Generated Overview</p>
                <p className="text-white text-sm leading-relaxed relative font-light">{briefing.ai_briefing_text}</p>
              </div>
            )}

            {/* Last visit summary */}
            {briefing.last_visit_summary && (
              <SectionCard title="📋 Since Your Last Visit" colour="card-pink">
                <p className="text-sm text-gray-700 leading-relaxed">{briefing.last_visit_summary}</p>
              </SectionCard>
            )}

            {/* Symptom trends */}
            {briefing.key_notes && (
              <SectionCard title="📊 Recent Symptom Trends" colour="card-teal">
                <p className="text-sm text-gray-700 leading-relaxed">{briefing.key_notes}</p>
                {Object.entries(briefing.symptom_trends || {}).map(([key, avg]) => (
                  <div key={key} className="mt-3">
                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                      <span className="capitalize">{key.replace('_level', '').replace('_', ' ')}</span>
                      <span className="text-pink-500">{avg as unknown as number}/10 avg</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-400 to-teal-400 rounded-full"
                        style={{ width: `${((avg as number) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </SectionCard>
            )}

            {/* Unresolved concerns */}
            {briefing.unresolved_concerns && (
              <SectionCard title="⚠️ Key Concerns to Raise" colour="card-gold">
                <p className="text-sm text-gray-700 leading-relaxed">{briefing.unresolved_concerns}</p>
              </SectionCard>
            )}

            {/* Suggested questions */}
            {briefing.suggested_questions?.length > 0 && (
              <SectionCard title="❓ Suggested Questions for Your Doctor" colour="card-teal">
                <ol className="space-y-2">
                  {briefing.suggested_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                      <p className="text-sm text-gray-700">{q}</p>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}

            {/* What to include in share */}
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <h3 className="font-bold text-gray-800 mb-3">📤 Share This Briefing</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(sections).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={val}
                      onChange={e => setSections(s => ({ ...s, [key]: e.target.checked }))}
                      className="accent-teal-500" />
                    <span className="capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={shareWithDoctor} className="btn-teal text-sm flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> Share Link
                </button>
                <button onClick={() => window.print()} className="btn-outline text-sm flex items-center gap-1">
                  <Printer className="w-3 h-3" /> Print
                </button>
                <button onClick={() => toast('📧 Email feature coming soon')} className="btn-outline text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </button>
                <button onClick={() => toast('📄 PDF export coming soon')} className="btn-ghost text-sm flex items-center gap-1">
                  <Download className="w-3 h-3" /> Export PDF
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Generated {new Date(briefing.generated_at).toLocaleDateString('en-GB', {
                weekday:'long', day:'numeric', month:'long', year:'numeric',
                hour:'2-digit', minute:'2-digit',
              })}
            </p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center">
            <Brain className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">No briefing generated yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click "Generate Appointment Briefing" above to create your personalised doctor briefing.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function SectionCard({ title, colour, children }: { title: string; colour: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${colour === 'card-pink' ? 'border-t-4 border-t-pink-500 border-pink-100' : colour === 'card-teal' ? 'border-t-4 border-t-teal-500 border-teal-100' : 'border-t-4 border-t-gold-500 border-gold-100'}`}>
      <h3 className="font-bold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  )
}
