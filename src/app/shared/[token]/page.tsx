import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Health Summary — Crush Cancer & LIVE',
  description: 'Secure view-only health summary',
  robots: 'noindex,nofollow',
}

interface SharedPageProps {
  params: { token: string }
}

export default async function SharedReportPage({ params }: SharedPageProps) {
  const supabase = createClient()

  const { data: report } = await supabase
    .from('shared_reports')
    .select('*')
    .eq('share_token', params.token)
    .eq('is_active', true)
    .single()

  if (!report || new Date(report.token_expires_at) < new Date()) {
    notFound()
  }

  // Increment view count
  await supabase.from('shared_reports')
    .update({ view_count: report.view_count + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', report.id)

  const data = report.report_data as Record<string, any>
  const sections = report.included_sections as Record<string, boolean>

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-3xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center text-xl">🦋</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Crush Cancer &amp; LIVE</p>
              <p className="text-xs text-white/60">Secure Health Summary · View Only</p>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-3">{report.title}</h1>
          <div className="flex gap-4 mt-2 text-xs text-white/70 flex-wrap">
            <span>Created: {format(new Date(report.created_at), 'dd MMM yyyy')}</span>
            {report.date_range_from && (
              <span>Period: {format(new Date(report.date_range_from), 'dd MMM')} – {format(new Date(report.date_range_to || report.created_at), 'dd MMM yyyy')}</span>
            )}
            <span>Expires: {format(new Date(report.token_expires_at), 'dd MMM yyyy')}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-sm text-amber-800">
          <strong>Important:</strong> This is a patient-shared summary for informational purposes.
          It does not replace professional medical assessment. All clinical decisions remain with the
          patient's medical team.
        </div>

        {/* AI Summary */}
        {report.ai_summary && (
          <Section title="📋 Overview" colour="teal">
            <p className="text-sm text-gray-700 leading-relaxed">{report.ai_summary}</p>
          </Section>
        )}

        {/* Symptoms */}
        {sections.symptoms && data.symptoms?.length > 0 && (
          <Section title="📊 Recent Symptom Logs" colour="pink">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-pink-100">
                    {['Date','Pain','Fatigue','Nausea','Energy','Mood','Sleep'].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.symptoms.slice(0, 14).map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-2 px-2 font-semibold text-gray-600">
                        {format(new Date(s.logged_at), 'dd MMM')}
                      </td>
                      {[s.pain_level, s.fatigue_level, s.nausea_level, s.energy_level, s.mood, s.sleep_quality].map((v, i) => (
                        <td key={i} className="py-2 px-2">
                          <ScorePill value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Medications */}
        {sections.medications && data.medications?.length > 0 && (
          <Section title="💊 Current Medications" colour="gold">
            <div className="space-y-2">
              {data.medications.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gold-100 last:border-0">
                  <div>
                    <p className="font-bold text-sm">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.dosage} · {m.frequency}</p>
                  </div>
                  {m.purpose && <span className="text-xs bg-gold-50 text-gold-700 border border-gold-200 px-2 py-0.5 rounded-full">{m.purpose}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Appointments */}
        {sections.appointments && data.appointments?.length > 0 && (
          <Section title="📅 Recent Appointments" colour="teal">
            <div className="space-y-2">
              {data.appointments.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-teal-100 last:border-0">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold leading-none">{new Date(a.date).getDate()}</span>
                    <span className="text-xs">{format(new Date(a.date), 'MMM')}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.doctor || ''} {a.location ? `· ${a.location}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Treatments */}
        {sections.treatments && data.treatments?.length > 0 && (
          <Section title="🔬 Treatment History" colour="purple">
            <div className="space-y-2">
              {data.treatments.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-purple-100 last:border-0">
                  <div>
                    <p className="font-bold text-sm capitalize">{t.type.replace('_', ' ')} — Session {t.session_number}</p>
                    <p className="text-xs text-gray-500">{t.date} · {t.location || 'Location not recorded'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    t.completed ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.completed ? '✅ Complete' : 'Planned'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-gray-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            🔒 This report was shared securely via Crush Cancer &amp; LIVE
          </p>
          <p>View only · No account required · Expires {format(new Date(report.token_expires_at), 'dd MMMM yyyy')}</p>
          <p className="mt-3">
            <a href="https://crushcancerandlive.app" className="text-teal-500 hover:underline font-semibold">
              Crush Cancer &amp; LIVE · Empower · Heal · Thrive 🦋
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, colour, children }: { title: string; colour: string; children: React.ReactNode }) {
  const colours: Record<string, string> = {
    teal: 'border-t-teal-500 border-teal-100',
    pink: 'border-t-pink-500 border-pink-100',
    gold: 'border-t-yellow-500 border-yellow-100',
    purple: 'border-t-purple-500 border-purple-100',
  }
  return (
    <div className={`bg-white rounded-2xl border-2 border-t-4 ${colours[colour] || colours.teal} p-5 mb-4 shadow-sm`}>
      <h2 className="font-bold text-gray-800 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function ScorePill({ value }: { value: number }) {
  if (!value) return <span className="text-gray-300">—</span>
  const isHigh = value >= 7
  const isLow  = value <= 3
  return (
    <span className={`inline-block w-7 text-center text-xs font-bold rounded py-0.5 ${
      isHigh ? 'bg-red-100 text-red-600' : isLow ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
    }`}>{value}</span>
  )
}
