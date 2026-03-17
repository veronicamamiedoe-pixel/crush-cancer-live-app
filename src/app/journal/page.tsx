'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, subDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import type { JournalEntry } from '@/types'

const HEALING_DECLARATIONS = [
  { text: "I will not die but live, and declare the works of the Lord.", ref: "Psalm 118:17" },
  { text: "By His stripes, I am healed.", ref: "Isaiah 53:5" },
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "The Lord is my strength and shield; He restores my health.", ref: "Psalm 28:7" },
  { text: "God has not given me a spirit of fear, but of power, love and a sound mind.", ref: "2 Timothy 1:7" },
  { text: "He heals the brokenhearted and binds up their wounds.", ref: "Psalm 147:3" },
  { text: "For I know the plans I have for you — plans for a hope and a future.", ref: "Jeremiah 29:11" },
]

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Very Low' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
]

const blankEntry = {
  reflection: '', gratitude_1: '', gratitude_2: '', gratitude_3: '',
  prayer: '', affirmation: '', small_win: '', title: '',
  mood: 3 as any, energy_level: 5 as any, faith_level: 5 as any, is_private: true,
}

export default function JournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entry, setEntry]   = useState<Partial<JournalEntry>>(blankEntry)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [declIdx, setDeclIdx] = useState(0)
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])

  const dateKey = format(currentDate, 'yyyy-MM-dd')

  useEffect(() => {
    setDeclIdx(Math.floor(Math.random() * HEALING_DECLARATIONS.length))
    fetchEntry(dateKey)
    fetchRecentEntries()
  }, [dateKey])

  const fetchEntry = async (date: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('journal_entries')
      .select('*').eq('user_id', user.id).eq('entry_date', date).single()
    setEntry(data || { ...blankEntry, entry_date: date })
    setLoading(false)
  }

  const fetchRecentEntries = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('journal_entries')
      .select('id,entry_date,title,mood,small_win').eq('user_id', user.id)
      .order('entry_date', { ascending: false }).limit(7)
    setRecentEntries((data || []) as any)
  }

  const saveEntry = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { ...entry, user_id: user.id, entry_date: dateKey }
    const { error } = await supabase.from('journal_entries')
      .upsert(payload, { onConflict: 'user_id,entry_date' })
    if (error) { toast.error('Could not save entry'); setSaving(false); return }
    toast.success('📔 Journal entry saved!')
    setSaving(false)
    fetchRecentEntries()
  }

  const isToday = dateKey === format(new Date(), 'yyyy-MM-dd')
  const decl = HEALING_DECLARATIONS[declIdx % HEALING_DECLARATIONS.length]

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">

        {/* Header */}
        <div>
          <p className="sec-eyebrow">Reflect · Release · Rejoice</p>
          <h2 className="font-display text-4xl text-gray-900">My <span className="text-pink-500">Journal</span></h2>
          <p className="sec-intro">Your sacred space. No rules, no judgment. Write freely.</p>
        </div>

        {/* Daily declaration banner */}
        <div className="bg-ccl-hero rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-48 h-48 bg-gold-400/15 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-300 mb-2">Today's Declaration</p>
            <p className="font-display text-2xl text-white italic mb-2">"{decl.text}"</p>
            <p className="text-xs text-white/60 font-bold tracking-wide">— {decl.ref}</p>
            <button
              onClick={() => setDeclIdx(i => (i + 1) % HEALING_DECLARATIONS.length)}
              className="mt-3 text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-1.5 rounded-full transition-all"
            >
              Next declaration →
            </button>
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-pink-100 p-3 shadow-card">
          <button onClick={() => setCurrentDate(d => subDays(d, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Previous day">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-800">
              {isToday ? '📅 Today' : format(currentDate, 'EEEE')}
            </p>
            <p className="text-sm text-gray-400">{format(currentDate, 'dd MMMM yyyy')}</p>
          </div>
          <button
            onClick={() => setCurrentDate(d => addDays(d, 1))}
            disabled={isToday}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-5">

            {/* Mood & scores */}
            <div className="ccl-card ccl-card-gold p-6">
              <h3 className="font-bold text-gray-800 mb-4">🌡 How are you today?</h3>

              <div className="mb-4">
                <label className="ccl-label">Mood</label>
                <div className="flex gap-3 mt-2">
                  {MOOD_OPTIONS.map(m => (
                    <button key={m.value} onClick={() => setEntry(e => ({ ...e, mood: m.value as any }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                        entry.mood === m.value ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
                      }`}>
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-xs font-bold text-gray-600">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="ccl-label">Energy — {entry.energy_level}/10</label>
                  <input type="range" min="1" max="10" value={entry.energy_level || 5}
                    onChange={e => setEntry(f => ({ ...f, energy_level: Number(e.target.value) }))}
                    className="w-full accent-gold-500 mt-1" />
                </div>
                <div>
                  <label className="ccl-label">Faith — {entry.faith_level}/10</label>
                  <input type="range" min="1" max="10" value={entry.faith_level || 5}
                    onChange={e => setEntry(f => ({ ...f, faith_level: Number(e.target.value) }))}
                    className="w-full accent-teal-500 mt-1" />
                </div>
              </div>
            </div>

            {/* Gratitude */}
            <div className="ccl-card ccl-card-pink p-6">
              <h3 className="font-bold text-gray-800 mb-4">🌹 Three Things I'm Grateful For</h3>
              <div className="space-y-3">
                {(['gratitude_1','gratitude_2','gratitude_3'] as const).map((key, i) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-2.5">{i+1}</span>
                    <input type="text" className="ccl-input flex-1"
                      placeholder={['Something simple I noticed today...','A person who showed up for me...','A moment of grace or beauty...'][i]}
                      value={(entry as any)[key] || ''}
                      onChange={e => setEntry(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Reflection */}
            <div className="ccl-card ccl-card-teal p-6">
              <h3 className="font-bold text-gray-800 mb-2">✍️ Daily Reflection</h3>
              <p className="text-xs text-gray-400 mb-3 italic">Write freely — what's on your heart today?</p>
              <textarea className="ccl-textarea min-h-[140px]"
                placeholder="Pour your thoughts, feelings, fears, and hopes here. There is no right or wrong..."
                value={entry.reflection || ''}
                onChange={e => setEntry(f => ({ ...f, reflection: e.target.value }))} />
            </div>

            {/* Small win */}
            <div className="ccl-card p-6" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(26,158,160,0.05))' }}>
              <h3 className="font-bold text-gray-800 mb-2">⭐ One Small Win Today</h3>
              <input type="text" className="ccl-input"
                placeholder="Even the tiniest step forward counts..."
                value={entry.small_win || ''}
                onChange={e => setEntry(f => ({ ...f, small_win: e.target.value }))} />
            </div>

            {/* Prayer */}
            <div className="ccl-card ccl-card-gold p-6">
              <h3 className="font-bold text-gray-800 mb-2">🙏 My Prayer Today</h3>
              <textarea className="ccl-textarea min-h-[120px]"
                placeholder="Write your prayer freely — God hears every word..."
                value={entry.prayer || ''}
                onChange={e => setEntry(f => ({ ...f, prayer: e.target.value }))} />
            </div>

            {/* Affirmation */}
            <div className="ccl-card p-6 bg-gradient-to-br from-pink-50 to-teal-50 border-pink-100">
              <h3 className="font-bold text-gray-800 mb-2">💛 My Affirmation for Today</h3>
              <input type="text" className="ccl-input"
                placeholder="I declare that I am..."
                value={entry.affirmation || ''}
                onChange={e => setEntry(f => ({ ...f, affirmation: e.target.value }))} />
            </div>

            {/* Privacy */}
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100 p-4">
              <input type="checkbox" id="private-cb" checked={entry.is_private !== false}
                onChange={e => setEntry(f => ({ ...f, is_private: e.target.checked }))}
                className="w-4 h-4 accent-teal-500" />
              <label htmlFor="private-cb" className="text-sm font-semibold text-gray-600 cursor-pointer">
                🔒 Keep this entry private (not visible to caregivers)
              </label>
            </div>

            {/* Save */}
            <button onClick={saveEntry} disabled={saving} className="btn-primary w-full py-4 text-base">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Today's Entry
                </span>
              )}
            </button>

          </div>
        )}

        {/* Recent entries */}
        {recentEntries.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Recent Entries
            </h3>
            <div className="space-y-2">
              {recentEntries.filter(e => e.entry_date !== dateKey).slice(0, 5).map(e => (
                <button
                  key={e.id}
                  onClick={() => setCurrentDate(parseISO(e.entry_date))}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {MOOD_OPTIONS.find(m => m.value === e.mood)?.emoji || '📔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">
                      {format(parseISO(e.entry_date), 'EEEE dd MMMM')}
                    </p>
                    {e.small_win && <p className="text-xs text-gray-500 truncate">⭐ {e.small_win}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
