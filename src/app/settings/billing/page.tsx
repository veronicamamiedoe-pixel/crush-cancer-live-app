'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Shield, Zap } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { PLAN_FEATURES, PLAN_PRICES, STRIPE_PLANS } from '@/types'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: '🌱',
    tagline: 'Get started on your healing journey',
    color: 'border-gray-200',
    headerBg: 'bg-gray-50',
    ctaClass: 'btn-outline',
  },
  {
    id: 'support',
    name: 'Support Plan',
    icon: '💛',
    tagline: 'Full tracking tools for your journey',
    color: 'border-pink-300',
    headerBg: 'bg-gradient-to-br from-pink-50 to-pink-100',
    ctaClass: 'btn-primary',
    priceId: process.env.NEXT_PUBLIC_STRIPE_SUPPORT_PRICE_ID,
  },
  {
    id: 'premium',
    name: 'Premium Healing',
    icon: '✨',
    tagline: 'Everything + AI assistant & full access',
    color: 'border-teal-400',
    headerBg: 'bg-gradient-to-br from-teal-50 to-teal-100',
    ctaClass: 'btn-teal',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
  },
] as const

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState<string | null>(null)
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlan = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('subscriptions').select('plan,current_period_end').eq('user_id', user.id).single()
      if (data) {
        setCurrentPlan(data.plan)
        setSubscriptionEnd(data.current_period_end)
      }
    }
    fetchPlan()

    // Handle return from Stripe
    const params = new URLSearchParams(window.location.search)
    if (params.get('success'))  toast.success('🎉 Subscription activated! Welcome to your new plan.')
    if (params.get('canceled')) toast.error('Checkout was cancelled. No charges made.')
  }, [])

  const handleUpgrade = async (planId: string, priceId?: string) => {
    if (planId === 'free' || !priceId) return
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { sessionUrl, error } = await res.json()
      if (error) { toast.error(error); setLoading(null); return }
      window.location.href = sessionUrl
    } catch {
      toast.error('Could not start checkout. Please try again.')
      setLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      toast.error('Could not open billing portal.')
      setLoading(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center">
          <p className="sec-eyebrow">Choose Your Plan</p>
          <h2 className="font-display text-4xl text-gray-900">Simple, <span className="text-pink-500">Caring</span> Pricing</h2>
          <p className="sec-intro mx-auto">
            Start free. Upgrade when you're ready. Every plan includes a 14-day free trial on paid tiers.
            Cancel anytime — no questions asked.
          </p>
        </div>

        {/* Current plan banner */}
        {currentPlan !== 'free' && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-teal-600" />
              <div>
                <p className="font-bold text-teal-700 text-sm">
                  You're on the {currentPlan === 'support' ? 'Support' : 'Premium Healing'} Plan
                </p>
                {subscriptionEnd && (
                  <p className="text-xs text-teal-600">
                    Renews {new Date(subscriptionEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <button onClick={handleManageBilling} disabled={loading === 'portal'} className="btn-outline text-sm py-2">
              {loading === 'portal' ? 'Opening...' : 'Manage Billing'}
            </button>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const isCurrent = currentPlan === plan.id
            const price     = PLAN_PRICES[plan.id as keyof typeof PLAN_PRICES]
            const features  = PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES]

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl border-2 overflow-hidden flex flex-col ${plan.color} ${
                  plan.popular ? 'shadow-teal ring-2 ring-teal-400' : 'shadow-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div className={`p-6 ${plan.headerBg}`}>
                  <span className="text-3xl">{plan.icon}</span>
                  <h3 className="font-bold text-xl text-gray-800 mt-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{plan.tagline}</p>
                  <div className="mt-4">
                    {price.monthly === 0 ? (
                      <p className="text-3xl font-bold text-gray-800">Free</p>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-800">£{price.monthly}</span>
                        <span className="text-gray-500 text-sm">/month</span>
                        <p className="text-xs text-green-600 font-semibold mt-0.5">14-day free trial</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="bg-gray-100 text-gray-500 font-bold text-sm py-3 rounded-2xl text-center">
                      ✅ Current Plan
                    </div>
                  ) : plan.id === 'free' ? (
                    <div className="text-gray-400 font-semibold text-sm py-3 text-center">
                      Downgrade to free
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id, (plan as any).priceId)}
                      disabled={loading === plan.id}
                      className={`${plan.ctaClass} w-full justify-center`}
                    >
                      {loading === plan.id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Please wait...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Upgrade Now
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '🔒', label: 'GDPR Compliant', sub: 'Your data is safe' },
            { icon: '💳', label: 'Cancel Anytime', sub: 'No lock-in contracts' },
            { icon: '🛡', label: 'Secure Payments', sub: 'Powered by Stripe' },
            { icon: '💛', label: 'Patient First', sub: 'Built with care' },
          ].map((t, i) => (
            <div key={i} className="text-center p-4 bg-white rounded-2xl border border-pink-100">
              <span className="text-2xl">{t.icon}</span>
              <p className="font-bold text-sm text-gray-700 mt-1">{t.label}</p>
              <p className="text-xs text-gray-400">{t.sub}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="ccl-card p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel at any time?', a: 'Yes. Cancel any time from your billing settings. You keep access until the end of your billing period.' },
              { q: 'Is my health data private and secure?', a: 'Absolutely. All data is encrypted, GDPR compliant, and never shared with third parties. You own your data.' },
              { q: 'What happens after the free trial?', a: 'After 14 days, your card is charged the monthly fee. We send reminders before any charge.' },
              { q: 'Can my caregiver use the same account?', a: 'Caregivers create their own free account and are linked to your profile through the Care Squad feature.' },
              { q: 'Is the AI assistant medically certified?', a: 'Our AI assistant provides supportive guidance only — it is not a replacement for your medical team and should not be used for medical decisions.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <p className="font-bold text-sm text-gray-800">{item.q}</p>
                <p className="text-sm text-gray-500 mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
