'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [role, setRole]         = useState<'patient' | 'caregiver'>('patient')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)

    try {
      // Call our server-side signup API which bypasses the broken database trigger
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      if (data.success) {
        toast.success('Welcome to Crush Cancer & LIVE! 💛')
        // Small delay to let the toast show, then redirect
        setTimeout(() => {
          window.location.replace('/auth/login?signup=success')
        }, 800)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />
        </div>

        {/* Floating butterflies in corners */}
        <div className="absolute top-8 left-8 text-4xl animate-butterfly opacity-60">🦋</div>
        <div className="absolute top-8 right-8 text-4xl animate-butterfly opacity-60" style={{ animationDelay: '1s' }}>🦋</div>
        <div className="absolute bottom-8 left-8 text-3xl animate-butterfly opacity-40" style={{ animationDelay: '2s' }}>🦋</div>
        <div className="absolute bottom-8 right-8 text-3xl animate-butterfly opacity-40" style={{ animationDelay: '3s' }}>🦋</div>

        <div className="relative text-center text-white max-w-sm">
          {/* Logo image */}
          <img
            src="/logo.png"
            alt="Crush Cancer & LIVE"
            className="w-64 h-auto mx-auto mb-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />

          <p className="text-xs font-bold uppercase tracking-widest text-yellow-300 mb-2">
            Empower · Heal · Thrive
          </p>
          <h1 className="font-bold text-4xl text-white mb-2 leading-tight">
            Crush Cancer
            <br />
            <span className="text-teal-300">&amp; LIVE</span>
          </h1>
          <p className="text-white/70 text-sm font-light leading-relaxed mt-4">
            Join thousands of warriors managing their cancer journey with
            confidence, faith, and the support of their loved ones.
          </p>

          <div className="mt-8 space-y-3">
            {[
              '✅ Free to get started — no card required',
              '✅ Treatment & appointment planner',
              '✅ Symptom tracking with charts',
              '✅ AI health assistant',
              '✅ Faith, prayer & journal',
            ].map((f, i) => (
              <p key={i} className="text-white/80 text-sm text-left">{f}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-healing-bg overflow-y-auto">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Crush Cancer & LIVE" className="h-8 w-auto" />
            <span className="font-bold text-lg text-pink-500">Crush Cancer &amp; LIVE</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg py-12 lg:py-0"
        >
          <div className="text-center mb-6">
            <h1 className="font-bold text-3xl text-gray-900 mb-1">
              Start Your <span className="text-teal-500">Journey</span>
            </h1>
            <p className="text-sm text-gray-500 font-light">Create your free account — no card required</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8 border border-pink-100">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(['patient', 'caregiver'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    role === r
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <span className="text-2xl">{r === 'patient' ? '💛' : '🤝'}</span>
                  <p className="font-bold text-sm mt-1 capitalize">{r === 'patient' ? 'I am a Patient' : 'I am a Caregiver'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r === 'patient' ? 'Managing my own journey' : 'Supporting a loved one'}
                  </p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="ccl-label">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="ccl-input" placeholder="Your full name" required autoComplete="name" />
              </div>
              <div>
                <label className="ccl-label">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="ccl-input" placeholder="your@email.com" required autoComplete="email" />
              </div>
              <div>
                <label className="ccl-label">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="ccl-input pr-12" placeholder="Minimum 8 characters" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="ccl-label">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="ccl-input" placeholder="Repeat your password" required />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Create Free Account
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-pink-500 font-bold hover:text-pink-600">Sign in →</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-4">
            🔒 Your data is encrypted and never shared. We are GDPR compliant.<br />
            By signing up you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
