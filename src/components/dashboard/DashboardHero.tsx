'use client'

import { motion } from 'framer-motion'

const GREETINGS = [
  "You showed up today — that is already a victory. 💛",
  "Every step forward is progress. Keep going, warrior. 🦋",
  "God is with you in this. You are not walking alone. 🙏",
  "You are stronger than you know. 💪",
  "Today is a new opportunity to heal and thrive. 🌸",
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDayMessage(): string {
  return GREETINGS[new Date().getDay() % GREETINGS.length]
}

interface DashboardHeroProps {
  user?: {
    full_name?: string
    cancer_type?: string
    diagnosis_date?: string
    plan?: string
    oncologist?: string
    hospital?: string
    // legacy fields
    diagnosis?: string
  } | null
}

export function DashboardHero({ user }: DashboardHeroProps) {
  const firstName = user?.full_name?.split(' ')[0] || 'Warrior'
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const diagnosis = user?.cancer_type || user?.diagnosis

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-ccl-hero rounded-3xl overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      {/* Butterflies */}
      <div className="absolute top-4 right-8 text-2xl animate-butterfly opacity-70">🦋</div>
      <div className="absolute top-8 right-20 text-base animate-butterfly opacity-50" style={{ animationDelay: '2s' }}>🦋</div>

      <div className="relative p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-300 mb-1">{today}</p>
            <h1 className="font-bold text-3xl lg:text-4xl text-white mb-1">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-white/75 text-sm font-light">{getDayMessage()}</p>
          </div>

          {/* Treatment badge */}
          {diagnosis && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
              <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-0.5">My Journey</p>
              <p className="text-white font-bold text-sm">{diagnosis}</p>
              {user?.oncologist && (
                <p className="text-white/60 text-xs mt-0.5">Dr. {user.oncologist}</p>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Days on Journey', value: getDaysOnJourney(user?.diagnosis_date), icon: '📅' },
            { label: 'Plan', value: getPlanLabel(user?.plan), icon: '⭐' },
            { label: 'Hospital', value: user?.hospital || 'Add in settings', icon: '🏥' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
              <span className="text-lg">{stat.icon}</span>
              <p className="text-white font-bold text-sm mt-1 truncate">{stat.value}</p>
              <p className="text-white/60 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function getDaysOnJourney(diagnosisDate?: string): string {
  if (!diagnosisDate) return 'Add diagnosis date'
  const days = Math.floor((Date.now() - new Date(diagnosisDate).getTime()) / 86400000)
  return `Day ${days}`
}

function getPlanLabel(plan?: string): string {
  const labels: Record<string, string> = { free: 'Free Plan', support: '💛 Support', premium: '✨ Premium' }
  return labels[plan || 'free'] || 'Free Plan'
}
