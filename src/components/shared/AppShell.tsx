'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Pill, Activity, Calendar, BookOpen,
  FileText, Heart, Users, Brain, Apple, Settings,
  Menu, X, Bell, ChevronDown, LogOut, User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',        icon: LayoutDashboard, color: 'text-teal-500' },
  { href: '/treatment',     label: 'Treatment Plan',   icon: Calendar,        color: 'text-pink-500' },
  { href: '/medications',   label: 'Medications',      icon: Pill,            color: 'text-gold-500' },
  { href: '/symptoms',      label: 'Symptoms',         icon: Activity,        color: 'text-pink-500' },
  { href: '/nutrition',     label: 'Nutrition',        icon: Apple,           color: 'text-green-500' },
  { href: '/journal',       label: 'Journal',          icon: BookOpen,        color: 'text-teal-500' },
  { href: '/care-squad',    label: 'Care Squad',       icon: Users,           color: 'text-pink-500' },
  { href: '/documents',     label: 'Documents',        icon: FileText,        color: 'text-gold-500' },
  { href: '/library',       label: 'Library',          icon: Heart,           color: 'text-teal-500' },
  { href: '/ai-assistant',  label: 'AI Assistant',     icon: Brain,           color: 'text-pink-500', premium: true },
  { href: '/settings',      label: 'Settings',         icon: Settings,        color: 'text-gray-500' },
]

interface AppShellProps {
  children: React.ReactNode
  userName?: string
}

export function AppShell({ children, userName }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.replace('/auth/login')
  }

  return (
    <div className="min-h-screen flex bg-healing-bg">

      {/* ===== SIDEBAR — Desktop ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-pink-100 shadow-sm fixed inset-y-0 left-0 z-40">
        <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* ===== SIDEBAR — Mobile drawer ===== */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-pink-100">
                <BrandMark />
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent pathname={pathname} onSignOut={handleSignOut} mobile onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-pink-100 px-4 lg:px-6 h-16 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block">
            <PageTitle pathname={pathname} />
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                  {(userName || 'U')[0].toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-modal border border-gray-100 py-2 z-50"
                  >
                    <Link href="/settings/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link href="/settings/billing" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                      💳 Billing
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-pink-100 py-4 px-6 text-center">
          <p className="text-xs text-gray-400">
            <span className="font-bold text-base text-pink-500 mr-2">Crush Cancer &amp; LIVE</span>
            Empower · Heal · Thrive 🦋
          </p>
        </footer>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 group">
      <img
        src="/logo.png"
        alt="Crush Cancer & LIVE"
        className="h-9 w-auto group-hover:scale-105 transition-transform"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const fallback = target.nextElementSibling as HTMLElement
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <div className="hidden w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 to-teal-500 items-center justify-center shadow-pink group-hover:scale-105 transition-transform">
        <span className="text-white text-lg">🦋</span>
      </div>
      <div>
        <div className="font-bold text-lg text-pink-500 leading-none">Crush Cancer</div>
        <div className="text-xs font-bold text-teal-600 tracking-wide">&amp; LIVE</div>
      </div>
    </Link>
  )
}

function SidebarContent({
  pathname,
  onSignOut,
  mobile,
  onClose
}: {
  pathname: string
  onSignOut: () => void
  mobile?: boolean
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand */}
      {!mobile && (
        <div className="p-5 border-b border-pink-100">
          <BrandMark />
          <p className="text-xs text-gray-400 mt-1.5 font-semibold tracking-widest uppercase">Empower · Heal · Thrive</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'nav-item group',
                isActive && 'active'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-pink-500' : item.color)} />
              <span className={isActive ? 'text-pink-600 font-bold' : ''}>{item.label}</span>
              {item.premium && (
                <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-gold-400 to-gold-600 text-white px-2 py-0.5 rounded-full">
                  PRO
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-4 border-t border-pink-100">
        <div className="bg-gradient-to-br from-pink-50 to-teal-50 rounded-2xl p-4 border border-pink-100">
          <p className="text-xs font-bold text-gray-700 mb-1">✨ Unlock AI Assistant</p>
          <p className="text-xs text-gray-500 mb-3">Get the Premium Plan for full access.</p>
          <Link href="/settings/billing" className="btn-primary text-xs py-2 w-full">
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  )
}

function PageTitle({ pathname }: { pathname: string }) {
  const item = NAV_ITEMS.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))
  if (!item) return null
  const Icon = item.icon
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('w-5 h-5', item.color)} />
      <h1 className="text-lg font-bold text-gray-800">{item.label}</h1>
    </div>
  )
}
