// ============================================================
// UPDATED NAV ITEMS — replace NAV_ITEMS array in AppShell.tsx
// ============================================================
// Add these new items to the existing NAV_ITEMS array:

export const NAV_ITEMS_V2 = [
  // Existing
  { href: '/dashboard',           label: 'Dashboard',              icon: 'LayoutDashboard', colour: 'text-teal-500'   },
  { href: '/treatment',           label: 'Treatment Plan',         icon: 'Calendar',        colour: 'text-pink-500'   },
  { href: '/medications',         label: 'Medications',            icon: 'Pill',            colour: 'text-gold-500'   },
  { href: '/symptoms',            label: 'Symptoms',               icon: 'Activity',        colour: 'text-pink-500'   },
  { href: '/nutrition',           label: 'Nutrition & Wellness',   icon: 'Apple',           colour: 'text-green-500'  },
  { href: '/journal',             label: 'Journal',                icon: 'BookOpen',        colour: 'text-teal-500'   },
  // New v2 items
  { href: '/reminders',           label: 'Reminders',              icon: 'Bell',            colour: 'text-pink-500'   },
  { href: '/doctor-visits',       label: 'Doctor Visits',          icon: 'Stethoscope',     colour: 'text-teal-500'   },
  { href: '/prepare-appointment', label: 'Prepare Appointment',    icon: 'ClipboardCheck',  colour: 'text-gold-500',  plan: 'premium' },
  { href: '/side-effects',        label: 'Side-Effect Intel',      icon: 'Brain',           colour: 'text-purple-500',plan: 'premium' },
  { href: '/audio',               label: 'Guided Audio',           icon: 'Music',           colour: 'text-teal-500',  plan: 'premium' },
  { href: '/share-health',        label: 'Share Health Summary',   icon: 'Share2',          colour: 'text-pink-500',  plan: 'support' },
  { href: '/care-squad',          label: 'Care Squad',             icon: 'Users',           colour: 'text-pink-500'   },
  { href: '/documents',           label: 'Documents',              icon: 'FileText',        colour: 'text-gold-500'   },
  { href: '/library',             label: 'Library',                icon: 'Heart',           colour: 'text-teal-500'   },
  { href: '/ai-assistant',        label: 'AI Companion',           icon: 'Sparkles',        colour: 'text-pink-500',  plan: 'premium' },
  { href: '/settings',            label: 'Settings',               icon: 'Settings',        colour: 'text-gray-500'   },
]

// ============================================================
// UPDATED MIDDLEWARE — add new protected routes
// Replace the route arrays in middleware.ts
// ============================================================

export const MIDDLEWARE_CONFIG = {
  PREMIUM_ROUTES: [
    '/ai-assistant',
    '/side-effects',
    '/prepare-appointment',
    '/audio',
  ],
  SUPPORT_ROUTES: [
    '/documents',
    '/library',
    '/share-health',
    '/doctor-visits',
    '/reminders',
  ],
}

// ============================================================
// UPDATED DASHBOARD — add these new widgets
// Add to dashboard/page.tsx data fetching
// ============================================================

export const DASHBOARD_V2_QUERIES = `
// Add to fetchDashboard() in dashboard/page.tsx:

const [
  // ... existing queries ...
  { data: overdueReminders },
  { data: todayAudio },
  { data: recentVisits },
  { data: pendingActions },
] = await Promise.all([
  // ... existing ...
  supabase.from('reminders').select('*')
    .eq('user_id', user.id).eq('is_active', true).eq('completed', false)
    .lt('due_at', new Date().toISOString()).limit(5),

  supabase.from('audio_schedules').select('*, audio:audio_library(*)')
    .eq('user_id', user.id).eq('is_active', true),

  supabase.from('doctor_visits').select('*')
    .eq('user_id', user.id).order('visit_date', { ascending: false }).limit(3),

  supabase.from('visit_action_items').select('*')
    .eq('user_id', user.id).eq('completed', false).limit(5),
])
`
