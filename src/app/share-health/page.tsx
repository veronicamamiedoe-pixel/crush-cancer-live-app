'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Share2, Copy, Mail, Printer, Eye, Calendar, Trash2, Plus } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { SharedReport, ReportType } from '@/types/v2'
import toast from 'react-hot-toast'

const REPORT_TYPES: { value: ReportType; label: string; emoji: string; desc: string }[] = [
  { value: 'symptom_report',      label: 'Symptom Report',           emoji: '📊', desc: 'Your symptom trends and logs for a date range' },
  { value: 'appointment_briefing',label: 'Appointment Briefing',     emoji: '📋', desc: 'Prepared summary for your next doctor visit' },
  { value: 'treatment_history',   label: 'Treatment History',        emoji: '💊', desc: 'All treatment sessions and responses' },
  { value: 'side_effect_summary', label: 'Side-Effect Summary',      emoji: '⚠️', desc: 'Identified patterns and side effects' },
  { value: 'doctor_visit_summary',label: 'Doctor Visit Summary',     emoji: '🏥', desc: 'Notes and outcomes from a specific visit' },
  { value: 'full_health_summary', label: 'Full Health Summary',      emoji: '📄', desc: 'Comprehensive overview of your health journey' },
]

const SECTION_OPTIONS = [
  { key: 'symptoms',     label: 'Symptom logs',         default: true  },
  { key: 'appointments', label: 'Appointments',          default: true  },
  { key: 'medications',  label: 'Medications list',      default: false },
  { key: 'treatments',   label: 'Treatment sessions',    default: true  },
  { key: 'visits',       label: 'Doctor visit notes',    default: false },
  { key: 'patterns',     label: 'Side-effect patterns',  default: false },
]

export default function ShareHealthPage() {
  const [reports, setReports]   = useState<SharedReport[]>([])
  const [showCreate, setCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    report_type: 'symptom_report' as ReportType,
    title: '',
    date_range_from: '',
    date_range_to: new Date().toISOString().split('T')[0],
    sections: Object.fromEntries(SECTION_OPTIONS.map(s => [s.key, s.default])),
  })

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('shared_reports').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setReports(data || [])
  }

  const createReport = async () => {
    if (!form.title) { toast.error('Please add a report title'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/share-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: form.report_type,
          title: form.title,
          date_range_from: form.date_range_from || undefined,
          date_range_to: form.date_range_to,
          included_sections: form.sections,
        }),
      })
      const data = await res.json()
      if (data.shareToken) {
        toast.success('✅ Shareable report created!')
        fetchReports()
        setCreate(false)
      }
    } catch {
      toast.error('Could not create report')
    } finally {
      setCreating(false)
    }
  }

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/shared/${token}`
    await navigator.clipboard.writeText(url).catch(() => {})
    toast.success('🔗 Link copied to clipboard!')
  }

  const deactivateReport = async (id: string) => {
    const supabase = createClient()
    await supabase.from('shared_reports').update({ is_active: false }).eq('id', id)
    setReports(r => r.filter(x => x.id !== id))
    toast('Report deactivated')
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Share Your Health Data Securely</p>
            <h2 className="font-bold text-4xl text-gray-900">Share <span className="text-teal-500">Health Summary</span></h2>
            <p className="sec-intro">
              Generate secure, view-only reports to share with your doctors, specialists, or family.
              You control exactly what is included. Links expire automatically.
            </p>
          </div>
          <button onClick={() => setCreate(true)} className="btn-teal flex-shrink-0">
            <Plus className="w-4 h-4" /> Create Report
          </button>
        </div>

        {/* Privacy callout */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-bold text-teal-700 text-sm">Your privacy is protected</p>
            <p className="text-xs text-teal-600 mt-0.5">
              Each report uses a unique secure link that expires in 30 days. You choose exactly which
              sections to include. You can deactivate any report at any time.
            </p>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-teal-200 shadow-teal p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-5">📄 Create New Report</h3>

            <div className="space-y-4">
              <div>
                <label className="ccl-label">Report Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {REPORT_TYPES.map(rt => (
                    <button key={rt.value} onClick={() => setForm(f => ({ ...f, report_type: rt.value, title: rt.label }))}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        form.report_type === rt.value ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-200'
                      }`}>
                      <span className="text-xl">{rt.emoji}</span>
                      <p className="font-bold text-sm mt-1">{rt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{rt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="ccl-label">Report Title</label>
                <input className="ccl-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Symptom Report for Dr. Patel — March 2026" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ccl-label">From Date</label>
                  <input type="date" className="ccl-input" value={form.date_range_from}
                    onChange={e => setForm(f => ({ ...f, date_range_from: e.target.value }))} />
                </div>
                <div>
                  <label className="ccl-label">To Date</label>
                  <input type="date" className="ccl-input" value={form.date_range_to}
                    onChange={e => setForm(f => ({ ...f, date_range_to: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="ccl-label">Include Sections</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SECTION_OPTIONS.map(s => (
                    <label key={s.key} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                      <input type="checkbox" checked={form.sections[s.key]}
                        onChange={e => setForm(f => ({ ...f, sections: { ...f.sections, [s.key]: e.target.checked } }))}
                        className="accent-teal-500" />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={createReport} disabled={creating} className="btn-teal">
                  {creating ? 'Creating...' : '🔒 Generate Secure Report'}
                </button>
                <button onClick={() => setCreate(false)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Existing reports */}
        {reports.length === 0 && !showCreate ? (
          <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center">
            <Share2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">No shared reports yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first report to share with your doctor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Your Reports</h3>
            {reports.filter(r => r.is_active).map(report => {
              const rt = REPORT_TYPES.find(x => x.value === report.report_type)
              const isExpired = new Date(report.token_expires_at) < new Date()
              return (
                <div key={report.id} className={`bg-white rounded-2xl border-2 p-4 flex items-start gap-4 ${
                  isExpired ? 'border-gray-200 opacity-70' : 'border-pink-100'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {rt?.emoji || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{report.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created {format(new Date(report.created_at), 'dd MMM yyyy')} ·
                      Expires {format(new Date(report.token_expires_at), 'dd MMM yyyy')} ·
                      {report.view_count} views
                    </p>
                    {isExpired && <span className="badge-red text-xs mt-1">Expired</span>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button onClick={() => copyLink(report.share_token)} className="btn-ghost btn-sm flex items-center gap-1 text-xs">
                      <Copy className="w-3 h-3" /> Copy Link
                    </button>
                    <button onClick={() => window.open(`/shared/${report.share_token}`, '_blank')}
                      className="btn-ghost btn-sm flex items-center gap-1 text-xs">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button onClick={() => deactivateReport(report.id)}
                      className="btn-ghost btn-sm text-red-400 hover:text-red-600 flex items-center gap-1 text-xs">
                      <Trash2 className="w-3 h-3" /> Revoke
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
