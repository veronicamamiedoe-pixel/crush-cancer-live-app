'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, User } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [fullName, setFullName]   = useState('')
  const [cancerType, setCancerType] = useState('')
  const [diagnosisDate, setDiagnosisDate] = useState('')
  const [oncologist, setOncologist] = useState('')
  const [hospital, setHospital]   = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setFullName(profile.full_name || '')
        setCancerType(profile.cancer_type || '')
        setDiagnosisDate(profile.diagnosis_date || '')
        setOncologist(profile.oncologist || '')
        setHospital(profile.hospital || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        cancer_type: cancerType,
        diagnosis_date: diagnosisDate || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      if (error) { toast.error(error.message); return }
      toast.success('Profile updated! 💛')
    } catch {
      toast.error('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell userName={fullName}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-bold text-3xl text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your personal and medical information</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-pink-100 shadow-card p-8"
        >
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-10 rounded-xl" />
              <div className="skeleton h-10 rounded-xl" />
              <div className="skeleton h-10 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                  {fullName ? fullName[0].toUpperCase() : <User className="w-8 h-8" />}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{fullName || 'Your Name'}</p>
                  <p className="text-sm text-gray-500">Cancer Warrior 🦋</p>
                </div>
              </div>

              <div>
                <label className="ccl-label">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="ccl-input" placeholder="Your full name" required />
              </div>

              <div>
                <label className="ccl-label">Cancer Type / Diagnosis</label>
                <input type="text" value={cancerType} onChange={e => setCancerType(e.target.value)}
                  className="ccl-input" placeholder="e.g. Breast Cancer Stage 2" />
              </div>

              <div>
                <label className="ccl-label">Diagnosis Date</label>
                <input type="date" value={diagnosisDate} onChange={e => setDiagnosisDate(e.target.value)}
                  className="ccl-input" />
              </div>

              <div>
                <label className="ccl-label">Oncologist / Doctor Name</label>
                <input type="text" value={oncologist} onChange={e => setOncologist(e.target.value)}
                  className="ccl-input" placeholder="Dr. Smith" />
              </div>

              <div>
                <label className="ccl-label">Hospital / Treatment Centre</label>
                <input type="text" value={hospital} onChange={e => setHospital(e.target.value)}
                  className="ccl-input" placeholder="Royal Marsden Hospital" />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Profile
                  </span>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
