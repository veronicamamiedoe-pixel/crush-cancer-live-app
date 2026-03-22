'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Shield, Eye, EyeOff, Mail, Trash2, Check, X } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import type { CaregiverAccess } from '@/types/v2'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const PERMISSIONS = [
  { key: 'can_view_appointments', label: 'View appointments',         icon: '📅' },
  { key: 'can_log_medications',   label: 'Log medications',           icon: '💊' },
  { key: 'can_record_visits',     label: 'Record doctor visits',      icon: '🏥' },
  { key: 'can_track_symptoms',    label: 'Track symptoms',            icon: '📊' },
  { key: 'can_view_documents',    label: 'View documents',            icon: '📁' },
  { key: 'can_view_journal',      label: 'View journal entries',      icon: '📔' },
  { key: 'can_prepare_summaries', label: 'Help prepare summaries',    icon: '📋' },
]

const defaultForm = {
  caregiver_name: '', caregiver_email: '', relationship: '',
  can_view_appointments: true, can_log_medications: true,
  can_record_visits: true, can_track_symptoms: true,
  can_view_documents: false, can_view_journal: false,
  can_prepare_summaries: true,
}

export default function CareSquadPage() {
  const [caregivers, setCaregivers] = useState<CaregiverAccess[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(defaultForm)
  const [saving, setSaving]         = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  useEffect(() => { fetchCaregivers() }, [])

  const fetchCaregivers = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('caregiver_access').select('*')
      .eq('patient_id', user.id).eq('is_active', true)
      .order('created_at', { ascending: false })
    setCaregivers(data || [])
    setLoading(false)
  }

  const sendInvite = async () => {
    if (!form.caregiver_name) { toast.error('Please enter the caregiver\'s name'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('caregiver_access').insert({
      patient_id: user.id, ...form,
    }).select().single()

    if (error) { toast.error('Could not send invite'); setSaving(false); return }

    const link = `${window.location.origin}/caregiver/accept/${data.invite_token}`
    setInviteLink(link)
    await navigator.clipboard.writeText(link).catch(() => {})

    // If email provided, trigger email notification (production: via API)
    if (form.caregiver_email) {
      await fetch('/api/caregiver/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.invite_token, email: form.caregiver_email, name: form.caregiver_name }),
      }).catch(() => {})
    }

    toast.success('✅ Invite link copied! Share it with your caregiver.')
    setSaving(false)
    setShowForm(false)
    setForm(defaultForm)
    fetchCaregivers()
  }

  const updatePermissions = async (id: string, key: string, value: boolean) => {
    const supabase = createClient()
    await supabase.from('caregiver_access').update({ [key]: value }).eq('id', id)
    setCaregivers(prev => prev.map(c => c.id === id ? { ...c, [key]: value } : c))
    toast.success('Permissions updated')
  }

  const removeCaregiver = async (id: string) => {
    if (!confirm('Remove this caregiver? They will lose access to your data.')) return
    const supabase = createClient()
    await supabase.from('caregiver_access').update({ is_active: false }).eq('id', id)
    setCaregivers(prev => prev.filter(c => c.id !== id))
    toast('Caregiver access removed')
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="sec-eyebrow">Your Support Circle</p>
            <h2 className="font-bold text-4xl text-gray-900">
              Care <span className="text-pink-500">Squad</span>
            </h2>
            <p className="sec-intro">
              Invite caregivers to help manage your care. You control exactly what they can see and do.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Invite Caregiver
          </button>
        </div>

        {/* Privacy note */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-teal-700 text-sm">Your privacy is always protected</p>
            <p className="text-xs text-teal-600 mt-0.5">
              Caregivers only see what you explicitly grant access to. Journal entries,
              documents, and medical records are private by default. You can change or revoke access at any time.
            </p>
          </div>
        </div>

        {/* Invite link banner */}
        {inviteLink && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
            <p className="font-bold text-pink-700 text-sm mb-2">🔗 Invite Link Created & Copied!</p>
            <div className="flex items-center gap-2 bg-white rounded-xl border border-pink-200 px-3 py-2">
              <p className="text-xs text-gray-600 flex-1 truncate">{inviteLink}</p>
              <button onClick={() => navigator.clipboard.writeText(inviteLink)}
                className="text-teal-500 hover:text-teal-700 font-bold text-xs flex-shrink-0">Copy</button>
            </div>
            <p className="text-xs text-pink-600 mt-2">Share this link with your caregiver. It expires in 7 days.</p>
          </motion.div>
        )}

        {/* Invite form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden">
            <div className="bg-white rounded-3xl border-2 border-pink-200 shadow-pink p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" /> Invite a Caregiver
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="ccl-label">Caregiver's Name *</label>
                  <input className="ccl-input" value={form.caregiver_name}
                    onChange={e => setForm(f => ({ ...f, caregiver_name: e.target.value }))}
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="ccl-label">Email (optional)</label>
                  <input type="email" className="ccl-input" value={form.caregiver_email}
                    onChange={e => setForm(f => ({ ...f, caregiver_email: e.target.value }))}
                    placeholder="their@email.com" />
                </div>
                <div>
                  <label className="ccl-label">Relationship</label>
                  <select className="ccl-select" value={form.relationship}
                    onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
                    <option value="">Select...</option>
                    {['Spouse / Partner','Parent','Child','Sibling','Friend','Nurse / Carer','Other'].map(r => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="ccl-label mb-3">Permissions — What can they access?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PERMISSIONS.map(p => (
                    <label key={p.key}
                      className={cn('flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm',
                        (form as any)[p.key] ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300')}>
                      <input type="checkbox" checked={(form as any)[p.key]}
                        onChange={e => setForm(f => ({ ...f, [p.key]: e.target.checked }))}
                        className="accent-teal-500 w-4 h-4" />
                      <span>{p.icon}</span>
                      <span className="font-semibold text-gray-700 text-xs">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={sendInvite} disabled={saving} className="btn-primary">
                  <Mail className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Invite Link'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Caregiver list */}
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : caregivers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-pink-100 p-10 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">No caregivers yet</p>
            <p className="text-sm text-gray-400 mt-1">Invite a family member or carer to help support your journey.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {caregivers.map(cg => (
              <div key={cg.id} className="bg-white rounded-2xl border-2 border-pink-100 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-400 to-teal-500 flex items-center justify-center text-white font-bold text-base">
                      {cg.caregiver_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{cg.caregiver_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cg.relationship && <span className="text-xs text-gray-400">{cg.relationship}</span>}
                        {cg.caregiver_email && <span className="text-xs text-gray-400">· {cg.caregiver_email}</span>}
                      </div>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block',
                        cg.invite_accepted ? 'bg-teal-100 text-teal-700' : 'bg-gold-100 text-gold-700')}>
                        {cg.invite_accepted ? '✅ Active' : '⏳ Invite Pending'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeCaregiver(cg.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Permissions grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERMISSIONS.map(p => (
                    <button key={p.key} onClick={() => updatePermissions(cg.id, p.key, !(cg as any)[p.key])}
                      className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                        (cg as any)[p.key]
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400')}>
                      {(cg as any)[p.key]
                        ? <Check className="w-3 h-3 text-teal-500 flex-shrink-0" />
                        : <EyeOff className="w-3 h-3 flex-shrink-0" />
                      }
                      <span className="leading-tight">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
