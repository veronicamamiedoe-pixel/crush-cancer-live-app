'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bell, Pill, Activity, Brain, Music,
  ClipboardCheck, ChevronRight, Droplets, Check,
  AlertTriangle, Stethoscope, BookOpen
} from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  { href: '/symptoms',            label: 'Log Symptoms',         icon: Activity,       colour: 'bg-pink-50 text-pink-600 border-pink-200'    },
  { href: '/medications',         label: 'Medications',          icon: Pill,           colour: 'bg-gold-50 text-gold-600 border-gold-200'    },
  { href: '/doctor-visits',       label: 'Record Visit',         icon: Stethoscope,    colour: 'bg-teal-50 text-teal-600 border-teal-200'    },
  { href: '/prepare-appointment', label: 'Prepare Appt.',        icon: ClipboardCheck, colour: 'bg-purple-50 text-purple-600 border-purple-200'},
  { href: '/audio',               label: 'Audio',                icon: Music,          colour: 'bg-blue-50 text-blue-600 border-blue-200'    },
  { href: '/journal',             label: 'Journal',              icon: BookOpen,       colour: 'bg-pink-50 text-pink-600 border-pink-200'    },
]

const DECLARATIONS = [
  { text: '"I will not die but live, and declare the works of the Lord."',       ref: 'Psalm 118:17'   },
  { text: '"By His stripes, I am healed."',                                      ref: 'Isaiah 53:5'    },
  { text: '"The Lord is my strength and my shield."',                             ref: 'Psalm 28:7'     },
  { text: '"I can do all things through Christ who strengthens me."',             ref: 'Philippians 4:13'},
  { text: '"He heals the brokenhearted and binds up their wounds."',              ref: 'Psalm 147:3'    },
  { text: '"For I know the plans I have for you — plans to prosper you."',        ref: 'Jeremiah 29:11' },
  { text: '"Fear not, for I am with you; be not dismayed, for I am your God."',  ref: 'Isaiah 41:10'   },
]

export default function DashboardPage() {
  const [d, setD]             = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [declIdx, setDeclIdx] = useState(new Date().getDay() % DECLARATIONS.length)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const today = new Date().toISOString().split('T')[0]
      const todayStart = new Date(); todayStart.setHours(0,0,0,0)

      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('appointments').select('*').eq('user_id', user.id).gte('date', today).order('date').limit(3),
        supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('medication_logs').select('medication_id,taken').eq('user_id', user.id).gte('taken_at', todayStart.toISOString()),
        supabase.from('symptom_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1).single(),
        supabase.from('reminders').select('*').eq('user_id', user.id).eq('is_active', true).eq('completed', false).lt('due_at', new Date().toISOString()).limit(5),
        supabase.from('reminders').select('*').eq('user_id', user.id).eq('is_active', true).eq('completed', false).gte('due_at', todayStart.toISOString()).limit(5),
        supabase.from('doctor_visits').select('*').eq('user_id', user.id).order('visit_date', { ascending: false }).limit(2),
        supabase.from('visit_action_items').select('*').eq('user_id', user.id).eq('completed', false).limit(4),
        supabase.from('symptom_patterns').select('*').eq('user_id', user.id).eq('dismissed', false).limit(3),
        supabase.from('treatment_sessions').select('id,completed,total_sessions').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
        supabase.from('audio_schedules').select('*, audio:audio_library(title,category)').eq('user_id', user.id).eq('is_active', true),
      ])

      const get = (i: number) => results[i].status === 'fulfilled' ? (results[i] as any).value?.data : null

      const user_     = get(0)
      const appts     = get(1)
      const meds      = get(2)
      const medLogs   = get(3)
      const symptom   = get(4)
      const overdue   = get(5)
      const todayR    = get(6)
      const visits    = get(7)
      const actions   = get(8)
      const patterns  = get(9)
      const txSessions= get(10)
      const audioSched= get(11)

      const takenSet = new Set((medLogs || []).filter((l:any) => l.taken).map((l:any) => l.medication_id))
      const completedTx = (txSessions || []).filter((t:any) => t.completed).length
      const totalTx     = txSessions?.[0]?.total_sessions || completedTx

      setD({
        user: user_ || { id: user.id, full_name: user.user_metadata?.full_name || user.email },
        appts: appts || [], meds: meds || [],
        takenMeds: (meds || []).filter((m:any) => takenSet.has(m.id)).length,
        symptom, overdue: overdue || [], todayR: todayR || [],
        visits: visits || [], actions: actions || [], patterns: patterns || [],
        tx: { completed: completedTx, total: totalTx }, audioSched: audioSched || [],
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const dismissReminder = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id)
    setD((p:any) => ({ ...p, overdue: p.overdue.filter((r:any) => r.id !== id), todayR: p.todayR.filter((r:any) => r.id !== id) }))
  }

  const decl = DECLARATIONS[declIdx]
  const adherence = d?.meds?.length ? Math.round((d.takenMeds / d.meds.length) * 100) : 0

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <DashboardHero user={d?.user} />

        {/* Overdue alert */}
        {d?.overdue?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="font-bold text-sm text-red-700">{d.overdue.length} overdue reminder{d.overdue.length !== 1 ? 's' : ''}</p>
              <Link href="/reminders" className="ml-auto text-xs text-red-500 font-bold">View all →</Link>
            </div>
            {d.overdue.slice(0, 2).map((r:any) => (
              <div key={r.id} className="flex items-center gap-2 bg-white rounded-xl border border-red-100 px-3 py-2 mb-1">
                <Bell className="w-3 h-3 text-red-400" />
                <span className="text-sm flex-1 font-semibold text-gray-700">{r.title}</span>
                <button onClick={() => dismissReminder(r.id)} className="p-1 text-teal-500 hover:text-teal-700">
                  <CheckIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((a, i) => {
            const Icon = a.icon
            return (
              <motion.div key={a.href} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay: i*0.05 }}>
                <Link href={a.href} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 hover:scale-105 transition-all text-center', a.colour)}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold leading-tight">{a.label}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Appointments */}
            <Card title="📅 Upcoming Appointments" href="/treatment" loading={loading}>
              {d?.appts?.length === 0 ? <EmptyMsg>No appointments scheduled.</EmptyMsg>
                : d?.appts?.map((a:any, i:number) => (
                  <Row key={a.id} border={i > 0}>
                    <DateBadge date={a.date} colour="bg-teal-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.doctor || a.location || '—'}</p>
                    </div>
                    {a.time && <span className="text-xs font-bold text-teal-600">{a.time}</span>}
                  </Row>
                ))}
            </Card>

            {/* Medications */}
            <Card title="💊 Medications Today" href="/medications" loading={loading}>
              {!loading && <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600"><span className="font-bold text-teal-600">{d?.takenMeds}</span> / <span className="font-bold">{d?.meds?.length}</span> taken</p>
                  <span className={cn('text-xs font-bold px-2 py-1 rounded-full', adherence === 100 ? 'bg-teal-100 text-teal-700' : 'bg-gold-100 text-gold-700')}>{d?.meds?.length > 0 ? adherence + '%' : '—'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <motion.div initial={{ width:0 }} animate={{ width: d?.meds?.length > 0 ? `${adherence}%` : '0%' }} transition={{ duration:0.8 }}
                    className="h-full bg-gradient-to-r from-gold-400 to-teal-400 rounded-full" />
                </div>
                {d?.meds?.slice(0,4).map((m:any) => (
                  <Row key={m.id} border>
                    <Pill className="w-3 h-3 text-gold-500" />
                    <span className="text-sm flex-1 text-gray-700">{m.name} — {m.dosage}</span>
                    <span className="text-xs text-gray-400">{m.times?.[0]}</span>
                  </Row>
                ))}
              </>}
            </Card>

            {/* Today's reminders */}
            <Card title="🔔 Today's Reminders" href="/reminders" loading={loading}>
              {d?.todayR?.length === 0 ? <EmptyMsg>All clear today 🎉</EmptyMsg>
                : d?.todayR?.map((r:any, i:number) => (
                  <Row key={r.id} border={i > 0}>
                    <Bell className="w-3 h-3 text-pink-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">{format(new Date(r.due_at), 'HH:mm')}</p>
                    </div>
                    <button onClick={() => dismissReminder(r.id)} className="w-6 h-6 rounded-full border-2 border-teal-300 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-teal-500" />
                    </button>
                  </Row>
                ))}
            </Card>

            {/* Symptom snapshot */}
            {d?.symptom && (
              <Card title="📊 Latest Symptom Snapshot" href="/symptoms" loading={loading}>
                <p className="text-xs text-gray-400 mb-3">Logged {d.symptom.logged_at ? format(new Date(d.symptom.logged_at), 'dd MMM, HH:mm') : ''}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label:'Pain',    v: d.symptom.pain_level,    inv: false },
                    { label:'Fatigue', v: d.symptom.fatigue_level, inv: false },
                    { label:'Nausea',  v: d.symptom.nausea_level,  inv: false },
                    { label:'Energy',  v: d.symptom.energy_level,  inv: true  },
                  ].map(s => (
                    <div key={s.label} className="text-center bg-gray-50 rounded-xl p-2.5">
                      <p className={cn('text-2xl font-bold', s.inv ? (s.v>=7?'text-teal-500':s.v<=3?'text-red-500':'text-gold-500') : (s.v<=3?'text-teal-500':s.v>=7?'text-red-500':'text-gold-500'))}>{s.v}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent visits */}
            {d?.visits?.length > 0 && (
              <Card title="🏥 Recent Doctor Visits" href="/doctor-visits" loading={loading}>
                {d.visits.map((v:any, i:number) => (
                  <Row key={v.id} border={i > 0}>
                    <DateBadge date={v.visit_date} colour="bg-pink-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{v.title}</p>
                      <p className="text-xs text-gray-400 truncate">{v.ai_summary || v.doctor_name || '—'}</p>
                    </div>
                  </Row>
                ))}
              </Card>
            )}

            {/* Treatment progress */}
            {d?.tx?.total > 0 && (
              <Card title="🔬 Treatment Progress" href="/treatment" loading={loading}>
                <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                  <span>{d.tx.completed} / {d.tx.total} sessions</span>
                  <span className="text-teal-600">{Math.round((d.tx.completed / d.tx.total) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width:0 }} animate={{ width:`${(d.tx.completed/d.tx.total)*100}%` }} transition={{ duration:1 }}
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-teal-400" />
                </div>
              </Card>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-5">

            {/* Declaration */}
            <div className="bg-ccl-hero rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gold-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-3 right-4 text-xl animate-butterfly opacity-60">🦋</div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-300 mb-2 relative">Today's Declaration</p>
              <p className="font-display text-xl text-white italic leading-snug mb-2 relative">{decl.text}</p>
              <p className="text-xs text-white/50 font-bold relative">{decl.ref}</p>
              <button onClick={() => setDeclIdx(i => (i+1) % DECLARATIONS.length)}
                className="mt-3 text-xs text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-full transition-all relative">
                Next →
              </button>
            </div>

            {/* Hydration */}
            <Card title="💧 Hydration Reminder" href="/reminders" loading={false}>
              <div className="flex items-center gap-3 mb-3">
                <Droplets className="w-7 h-7 text-blue-400" />
                <div>
                  <p className="font-bold text-sm text-gray-700">Stay Hydrated Today</p>
                  <p className="text-xs text-gray-400">Aim for 8–10 glasses</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 8 }).map((_,i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center">
                    <Droplets className="w-3 h-3 text-blue-300" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Audio schedules */}
            {d?.audioSched?.length > 0 && (
              <Card title="🎵 Scheduled Audio" href="/audio" loading={loading}>
                {d.audioSched.slice(0, 3).map((s:any) => (
                  <Row key={s.id} border>
                    <div className="w-8 h-8 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Music className="w-3 h-3 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-700 truncate">{s.audio?.title || s.label}</p>
                      <p className="text-xs text-teal-500 font-bold">{s.scheduled_time}</p>
                    </div>
                  </Row>
                ))}
              </Card>
            )}

            {/* Patterns */}
            {d?.patterns?.length > 0 && (
              <Card title="🧠 Patterns Detected" href="/side-effects" loading={loading}>
                {d.patterns.slice(0, 2).map((p:any) => (
                  <div key={p.id} className="py-2 border-b border-gray-50 last:border-0">
                    <p className="font-bold text-xs text-gray-700">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                  </div>
                ))}
              </Card>
            )}

            {/* Prepare CTA */}
            <Link href="/prepare-appointment"
              className="block bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl p-5 hover:shadow-pink transition-all group">
              <ClipboardCheck className="w-7 h-7 text-white/80 mb-2" />
              <p className="font-bold text-white text-sm">Prepare for Your Next Appointment</p>
              <p className="text-xs text-white/70 mt-1">AI-powered briefing with questions & trends</p>
              <p className="text-xs text-white/60 mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                Generate now <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

          </div>
        </div>

        <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
          Crush Cancer &amp; LIVE is an organisational support tool only. It does not provide medical advice,
          diagnosis, or treatment. Always follow your medical team's guidance. 🦋
        </p>
      </div>
    </AppShell>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function Card({ title, href, loading, children }: { title:string; href:string; loading:boolean; children:React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        <Link href={href} className="text-xs text-teal-500 font-bold flex items-center gap-0.5 hover:underline">
          View <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? <div className="space-y-2"><div className="skeleton h-7 rounded-xl"/><div className="skeleton h-7 rounded-xl"/></div> : children}
    </div>
  )
}
function Row({ border, children }: { border?: boolean; children: React.ReactNode }) {
  return <div className={cn('flex items-center gap-3 py-2', border && 'border-t border-gray-50')}>{children}</div>
}
function EmptyMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 py-2">{children}</p>
}
function DateBadge({ date, colour }: { date: string; colour: string }) {
  return (
    <div className={cn('text-white rounded-xl px-2.5 py-1.5 text-center flex-shrink-0 min-w-[44px]', colour)}>
      <p className="text-sm font-bold leading-none">{format(parseISO(date), 'd')}</p>
      <p className="text-xs">{format(parseISO(date), 'MMM')}</p>
    </div>
  )
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
}
