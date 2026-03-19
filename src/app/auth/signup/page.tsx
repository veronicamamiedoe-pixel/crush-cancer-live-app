'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [role, setRole]         = useState<'patient' | 'caregiver'>('patient')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8)  { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      if (data?.session) {
        toast.success('Welcome to Crush Cancer & LIVE! 💛')
        window.location.replace('/dashboard')
      } else {
        toast.success('Account created! Please check your email to confirm, then log in.')
        setLoading(false)
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-healing-bg p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-card p-10 max-w-md w-full text-center border border-pink-100"
        >
          <div className="text-6xl mb-5 animate-float">🦋</div>
          <h2 className="font-bold text-3xl text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            We've sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account and start your healing journey.
          </p>
          <Link href="/auth/login" className="btn-primary w-full justify-center">
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-healing-bg p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-warm-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center gap-2 mb-4">
            <img src="/logo.png" alt="Crush Cancer & LIVE Logo" className="w-48 h-auto mx-auto" />
          </Link>
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
  )
}
