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
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const todayStart = new Date(); todayStart.setHours(0,0,0,0)

      // Fetch profile and subscription separately (they exist in the schema)
      const [
        { data: profile },
        { data: subscription },
        { data: meds },
        { data: medLogs },
        { data: symptoms },
        { data: reminders },
        { data: visits },
        { data: journalEntries },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('plan,status').eq('user_id', user.id).single(),
        supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('medication_logs').select('medication_id,taken').eq('user_id', user.id).gte('taken_at', todayStart.toISOString()),
        supabase.from('symptoms').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
        supabase.from('reminders').select('*').eq('user_id', user.id).eq('is_active', true).order('due_at').limit(10),
        supabase.from('doctor_visits').select('*').eq('user_id', user.id).order('visit_date', { ascending: false }).limit(3),
        supabase.from('journal_entries').select('id,entry_date,title,mood').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(3),
      ])

      const takenSet = new Set((medLogs || []).filter((l:any) => l.taken).map((l:any) => l.medication_id))
      const now = new Date()
      const overdueReminders = (reminders || []).filter((r:any) => r.due_at && new Date(r.due_at) < now)
      const todayReminders = (reminders || []).filter((r:any) => {
        if (!r.due_at) return false
        const d = new Date(r.due_at)
        return d >= todayStart && d.toDateString() === now.toDateString()
      })

      // Merge profile with subscription plan for DashboardHero
      const userWithPlan = profile ? { ...profile, plan: subscription?.plan || 'free' } : null

      setD({
        user: userWithPlan,
        meds: meds || [],
        takenMeds: (meds || []).filter((m:any) => takenSet.has(m.id)).length,
        symptoms: symptoms || [],
        latestSymptom: symptoms?.[0] || null,
        overdue: overdueReminders,
        todayR: todayReminders,
        visits: visits || [],
        journalEntries: journalEntries || [],
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const dismissReminder = async (id: string) => {
    const supabase = createClient()
    await supabase.from('reminders').update({ is_active: false }).eq('id', id)
    setD((p:any) => ({
      ...p,
      overdue: p.overdue.filter((r:any) => r.id !== id),
      todayR: p.todayR.filter((r:any) => r.id !== id)
    }))
  }

  const decl = DECLARATIONS[declIdx]
  const adherence = d?.meds?.length ? Math.round((d.takenMeds / d.meds.length) * 100) : 0

  return (
    <AppShell userName={d?.user?.full_name}>
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
                {d?.meds?.length === 0 && <EmptyMsg>No active medications. <Link href="/medications" className="text-teal-500 font-bold">Add one →</Link></EmptyMsg>}
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
                      {r.due_at && <p className="text-xs text-gray-400">{format(new Date(r.due_at), 'HH:mm')}</p>}
                    </div>
                    <button onClick={() => dismissReminder(r.id)} className="w-6 h-6 rounded-full border-2 border-teal-300 flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-teal-500" />
                    </button>
                  </Row>
                ))}
            </Card>

            {/* Symptom snapshot */}
            {d?.latestSymptom && (
              <Card title="📊 Latest Symptom" href="/symptoms" loading={loading}>
                <p className="text-xs text-gray-400 mb-3">
                  {d.latestSymptom.symptom_name} — Severity: <strong>{d.latestSymptom.severity}/10</strong>
                  {d.latestSymptom.logged_at && ` · ${format(new Date(d.latestSymptom.logged_at), 'dd MMM, HH:mm')}`}
                </p>
                {d.latestSymptom.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{d.latestSymptom.notes}</p>
                )}
                <Link href="/symptoms" className="text-xs text-teal-500 font-bold mt-2 inline-block">View all symptoms →</Link>
              </Card>
            )}

            {/* Recent visits */}
            {d?.visits?.length > 0 && (
              <Card title="🏥 Recent Doctor Visits" href="/doctor-visits" loading={loading}>
                {d.visits.map((v:any, i:number) => (
                  <Row key={v.id} border={i > 0}>
                    {v.visit_date && <DateBadge date={v.visit_date} colour="bg-pink-500" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{v.doctor_name || 'Doctor Visit'}</p>
                      <p className="text-xs text-gray-400 truncate">{v.specialty || v.location || '—'}</p>
                    </div>
                  </Row>
                ))}
              </Card>
            )}

            {/* Recent journal */}
            {d?.journalEntries?.length > 0 && (
              <Card title="📖 Recent Journal" href="/journal" loading={loading}>
                {d.journalEntries.map((j:any, i:number) => (
                  <Row key={j.id} border={i > 0}>
                    <BookOpen className="w-3 h-3 text-teal-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{j.title || 'Journal Entry'}</p>
                      <p className="text-xs text-gray-400">{j.entry_date}</p>
                    </div>
                    {j.mood && <span className="text-lg">{['😔','😕','😐','🙂','😊'][j.mood - 1]}</span>}
                  </Row>
                ))}
              </Card>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-5">

            {/* Declaration */}
            <div className="bg-ccl-hero rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gold-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-3 right-4 text-xl animate-butterfly opacity-60">🦋</div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-300 mb-2 relative">Today&apos;s Declaration</p>
              <p className="font-bold text-lg text-white italic leading-snug mb-2 relative">{decl.text}</p>
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

            {/* Prepare CTA */}
            <Link href="/prepare-appointment"
              className="block bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl p-5 hover:shadow-pink transition-all group">
              <ClipboardCheck className="w-7 h-7 text-white/80 mb-2" />
              <p className="font-bold text-white text-sm">Prepare for Your Next Appointment</p>
              <p className="text-xs text-white/70 mt-1">AI-powered briefing with questions &amp; trends</p>
              <p className="text-xs text-white/60 mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                Generate now <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            {/* AI Assistant CTA */}
            <Link href="/ai-assistant"
              className="block bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 hover:shadow-teal transition-all group">
              <Brain className="w-7 h-7 text-white/80 mb-2" />
              <p className="font-bold text-white text-sm">AI Health Assistant</p>
              <p className="text-xs text-white/70 mt-1">Ask questions about your treatment &amp; symptoms</p>
              <p className="text-xs text-white/60 mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                Chat now <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

          </div>
        </div>

        <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
          Crush Cancer &amp; LIVE is an organisational support tool only. It does not provide medical advice,
          diagnosis, or treatment. Always follow your medical team&apos;s guidance. 🦋
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
  try {
    return (
      <div className={cn('text-white rounded-xl px-2.5 py-1.5 text-center flex-shrink-0 min-w-[44px]', colour)}>
        <p className="text-sm font-bold leading-none">{format(parseISO(date), 'd')}</p>
        <p className="text-xs">{format(parseISO(date), 'MMM')}</p>
      </div>
    )
  } catch {
    return <div className={cn('text-white rounded-xl px-2.5 py-1.5 text-center flex-shrink-0 min-w-[44px]', colour)}>
      <p className="text-xs">—</p>
    </div>
  }
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
}
