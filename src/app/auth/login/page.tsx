'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      toast.success('Account created! Please sign in to continue. 💛')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      if (data?.session) {
        toast.success('Welcome back! 💛')
        window.location.replace('/dashboard')
      } else {
        toast.error('Please check your email to confirm your account first.')
        setLoading(false)
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
            Your professional companion for the cancer journey —
            tracking treatment, managing symptoms, staying spiritually
            strong, and coordinating the people who love you.
          </p>

          <div className="mt-8 space-y-3">
            {[
              '✅ Treatment & appointment planner',
              '✅ Symptom tracking with charts',
              '✅ AI health assistant',
              '✅ Care Squad coordination',
              '✅ Faith, prayer & journal',
            ].map((f, i) => (
              <p key={i} className="text-white/80 text-sm text-left">{f}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-healing-bg">
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
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="font-bold text-4xl text-gray-900 mb-1">
              Welcome <span className="text-pink-500">Back</span>
            </h1>
            <p className="text-gray-500 text-sm font-light">
              Sign in to your healing journey 🦋
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8 border border-pink-100">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="ccl-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="ccl-input"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="ccl-label">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="ccl-input pr-12"
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link href="/auth/reset-password" className="text-xs text-teal-600 hover:text-teal-700 font-semibold">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </span>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-pink-500 font-bold hover:text-pink-600">
                  Start your journey →
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            By signing in you agree to our{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/terms" className="underline">Terms of Service</Link>.
            <br />Your data is protected with enterprise-grade security.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
