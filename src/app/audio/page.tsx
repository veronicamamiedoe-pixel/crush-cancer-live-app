'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Heart,
  Plus, Clock, List, Calendar, Shuffle, Repeat
} from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import type { AudioTrack, AudioSchedule } from '@/types/v2'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const CATEGORY_CONFIG = {
  declaration:    { label: 'Declarations',          emoji: '⚡', colour: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200'   },
  affirmation:    { label: 'Affirmations',           emoji: '💛', colour: 'text-gold-600',   bg: 'bg-gold-50 border-gold-200'   },
  meditation:     { label: 'Meditations',            emoji: '🧘', colour: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200'   },
  prayer:         { label: 'Prayers',                emoji: '🙏', colour: 'text-purple-600', bg: 'bg-purple-50 border-purple-200'},
  visualisation:  { label: 'Visualisations',         emoji: '✨', colour: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200'   },
  encouragement:  { label: 'Encouragement',          emoji: '💪', colour: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  treatment_day:  { label: 'Treatment Day',          emoji: '💊', colour: 'text-orange-600', bg: 'bg-orange-50 border-orange-200'},
  bedtime:        { label: 'Bedtime',                emoji: '🌙', colour: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200'},
  caregiver:      { label: 'For Caregivers',         emoji: '🤝', colour: 'text-rose-600',   bg: 'bg-rose-50 border-rose-200'   },
  scripture:      { label: 'Scripture',              emoji: '📖', colour: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
}

const SCHEDULED_SESSIONS = [
  { time: '06:30', label: 'Morning Declarations', emoji: '🌅' },
  { time: '13:00', label: 'Treatment Peace',       emoji: '☀️' },
  { time: '21:00', label: 'Bedtime Meditation',    emoji: '🌙' },
]

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m/60)}h ${m % 60}m`
}

export default function AudioPage() {
  const [tracks, setTracks]           = useState<AudioTrack[]>([])
  const [favourites, setFavourites]   = useState<string[]>([])
  const [playlist, setPlaylist]       = useState<string[]>([])
  const [activeTrack, setActiveTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [volume, setVolume]           = useState(80)
  const [activeTab, setActiveTab]     = useState<'library' | 'schedule' | 'playlist' | 'favourites'>('library')
  const [activeCategory, setCategory] = useState<string>('all')
  const [schedules, setSchedules]     = useState<AudioSchedule[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchTracks()
    fetchPreferences()
    fetchSchedules()
  }, [])

  // Keep audio volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  const fetchTracks = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('audio_library').select('*').eq('is_active', true).order('category')
    setTracks(data || [])
  }

  const fetchPreferences = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('user_audio_preferences').select('*').eq('user_id', user.id).single()
    if (data) {
      setFavourites(data.favourites || [])
      setPlaylist(data.playlist || [])
      setVolume(data.volume || 80)
    }
  }

  const fetchSchedules = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('audio_schedules')
      .select('*, audio:audio_library(*)').eq('user_id', user.id).eq('is_active', true)
    setSchedules(data || [])
  }

  const playTrack = (track: AudioTrack) => {
    // Increment play count
    const supabase = createClient()
    supabase.from('audio_library').update({ play_count: track.play_count + 1 }).eq('id', track.id)

    if (activeTrack?.id === track.id) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false) }
      else           { audioRef.current?.play();  setIsPlaying(true)  }
      return
    }

    setActiveTrack(track)
    setCurrentTime(0)
    setDuration(track.duration_seconds)
    setIsPlaying(true)

    // In production, audioRef.current.src = track.file_url
    // For demo we just simulate
  }

  const toggleFavourite = async (trackId: string) => {
    const newFavs = favourites.includes(trackId)
      ? favourites.filter(id => id !== trackId)
      : [...favourites, trackId]
    setFavourites(newFavs)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_audio_preferences').upsert({ user_id: user.id, favourites: newFavs }, { onConflict: 'user_id' })
    toast(newFavs.includes(trackId) ? '❤️ Added to favourites' : '💔 Removed from favourites')
  }

  const addToPlaylist = async (trackId: string) => {
    if (playlist.includes(trackId)) { toast('Already in playlist'); return }
    const newPlaylist = [...playlist, trackId]
    setPlaylist(newPlaylist)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_audio_preferences').upsert({ user_id: user.id, playlist: newPlaylist }, { onConflict: 'user_id' })
    toast.success('➕ Added to playlist')
  }

  const filteredTracks = tracks.filter(t =>
    activeCategory === 'all' || t.category === activeCategory
  )

  const favouriteTracks = tracks.filter(t => favourites.includes(t.id))
  const playlistTracks  = tracks.filter(t => playlist.includes(t.id))

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <p className="sec-eyebrow">Premium Feature — Guided Hope &amp; Healing</p>
          <h2 className="font-display text-4xl text-gray-900">
            Audio <span className="text-teal-500">Library</span>
          </h2>
          <p className="sec-intro">
            Declarations, prayers, meditations, and encouragement — spoken over your healing journey.
            Schedule sessions at times that matter to you.
          </p>
        </div>

        {/* Scheduled sessions banner */}
        <div className="bg-ccl-hero rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-48 h-48 bg-gold-400/15 rounded-full blur-2xl" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-300 mb-3 relative">Today's Scheduled Sessions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
            {SCHEDULED_SESSIONS.map(s => (
              <div key={s.time} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15 flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="text-white font-bold text-sm">{s.label}</p>
                  <p className="text-white/60 text-xs">{s.time}</p>
                </div>
                <button onClick={() => { const t = tracks.find(x => x.category === 'declaration'); if (t) playTrack(t) }}
                  className="ml-auto w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <Play className="w-3 h-3 text-white fill-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Now Playing bar */}
        <AnimatePresence>
          {activeTrack && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border-2 border-teal-200 p-4 shadow-teal sticky top-16 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xl flex-shrink-0">
                  {CATEGORY_CONFIG[activeTrack.category]?.emoji || '🎵'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{activeTrack.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{activeTrack.category.replace('_', ' ')}</p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-teal-400 rounded-full transition-all"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentTime(Math.max(0, currentTime - 15))}
                    className="p-2 rounded-xl hover:bg-gray-100"><SkipBack className="w-4 h-4" /></button>
                  <button onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center shadow-teal transition-all">
                    {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
                  </button>
                  <button onClick={() => setCurrentTime(Math.min(duration, currentTime + 15))}
                    className="p-2 rounded-xl hover:bg-gray-100"><SkipForward className="w-4 h-4" /></button>
                  <div className="flex items-center gap-1 ml-2">
                    <Volume2 className="w-3 h-3 text-gray-400" />
                    <input type="range" min="0" max="100" value={volume}
                      onChange={e => setVolume(Number(e.target.value))}
                      className="w-16 accent-teal-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['library','playlist','favourites','schedule'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-5 py-2.5 rounded-full text-sm font-bold transition-all capitalize',
                activeTab === tab ? 'bg-teal-500 text-white shadow-teal' : 'bg-white border border-teal-100 text-gray-500 hover:border-teal-300')}>
              {tab === 'library' ? '📚 Library' : tab === 'playlist' ? `🎶 My Playlist (${playlist.length})` : tab === 'favourites' ? `❤️ Favourites (${favourites.length})` : '📅 Schedule'}
            </button>
          ))}
        </div>

        {/* Library tab */}
        {activeTab === 'library' && (
          <div className="space-y-5">
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCategory('all')}
                className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  activeCategory === 'all' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 text-gray-500')}>
                All
              </button>
              {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all',
                    activeCategory === cat ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 text-gray-500')}>
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>

            {/* Track grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTracks.map((track, i) => {
                const cfg = CATEGORY_CONFIG[track.category]
                const isFav = favourites.includes(track.id)
                const isActive = activeTrack?.id === track.id
                return (
                  <motion.div key={track.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn('bg-white rounded-2xl border-2 p-4 hover:shadow-card transition-all',
                      isActive ? 'border-teal-400 shadow-teal' : 'border-pink-100')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border', cfg.bg)}>
                        {cfg.emoji}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => toggleFavourite(track.id)}
                          className={cn('p-1.5 rounded-lg transition-colors', isFav ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400')}>
                          <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
                        </button>
                        <button onClick={() => addToPlaylist(track.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-teal-500 transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-gray-800 mb-1">{track.title}</p>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{track.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(track.duration_seconds)}</span>
                        {track.play_count > 0 && <span>· {track.play_count} plays</span>}
                      </div>
                      <button onClick={() => playTrack(track)}
                        className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm',
                          isActive && isPlaying ? 'bg-teal-500 hover:bg-teal-600' : 'bg-pink-500 hover:bg-pink-600')}>
                        {isActive && isPlaying
                          ? <Pause className="w-4 h-4 text-white" />
                          : <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        }
                      </button>
                    </div>
                    {isActive && (
                      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full animate-pulse" style={{ width: '45%' }} />
                      </div>
                    )}
                  </motion.div>
                )
              })}
              {filteredTracks.length === 0 && (
                <div className="col-span-3 text-center py-10 text-gray-400">
                  <p className="text-4xl mb-2">🎵</p>
                  <p className="font-semibold">No tracks in this category yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Playlist tab */}
        {activeTab === 'playlist' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">My Playlist ({playlistTracks.length} tracks)</h3>
              <div className="flex gap-2">
                <button className="btn-ghost text-sm flex items-center gap-1"><Shuffle className="w-3 h-3" /> Shuffle</button>
                <button onClick={() => playlistTracks[0] && playTrack(playlistTracks[0])} className="btn-teal text-sm">
                  <Play className="w-3 h-3 fill-current" /> Play All
                </button>
              </div>
            </div>
            {playlistTracks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
                <List className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="font-semibold text-gray-500">Your playlist is empty</p>
                <p className="text-xs text-gray-400 mt-1">Add tracks from the Library tab</p>
              </div>
            ) : (
              playlistTracks.map((track, i) => <TrackRow key={track.id} track={track} index={i} onPlay={playTrack} isPlaying={isPlaying && activeTrack?.id === track.id} />)
            )}
          </div>
        )}

        {/* Favourites tab */}
        {activeTab === 'favourites' && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700">My Favourites ({favouriteTracks.length})</h3>
            {favouriteTracks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
                <Heart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="font-semibold text-gray-500">No favourites yet</p>
                <p className="text-xs text-gray-400 mt-1">Tap the heart on any track to save it here</p>
              </div>
            ) : (
              favouriteTracks.map((track, i) => <TrackRow key={track.id} track={track} index={i} onPlay={playTrack} isPlaying={isPlaying && activeTrack?.id === track.id} />)
            )}
          </div>
        )}

        {/* Schedule tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Scheduled Audio Sessions</h3>
              <button onClick={() => setShowScheduleModal(true)} className="btn-teal text-sm">
                <Plus className="w-3 h-3" /> Schedule Session
              </button>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-teal-700">
              <p className="font-bold mb-1">How it works</p>
              <p className="font-light">Schedule audio sessions at specific times each day. You'll receive a reminder, and the audio will automatically begin.</p>
            </div>
            {schedules.length === 0 ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="font-semibold text-gray-500">No scheduled sessions yet</p>
              </div>
            ) : (
              schedules.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-teal-200 p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center">
                    <span className="text-teal-600 font-bold text-sm">{s.scheduled_time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{s.label || s.audio?.title}</p>
                    <p className="text-xs text-gray-400">{s.audio?.category?.replace('_', ' ')} · Every {s.days_of_week?.length === 7 ? 'day' : 'selected days'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-full', s.is_active ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-400')}>
                      {s.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed border-t border-gray-100 pt-4">
          🔒 Audio content is for spiritual and emotional support only.
          It does not replace medical treatment or professional mental health care.
          Always follow your medical team's guidance.
        </p>

      </div>
    </AppShell>
  )
}

function TrackRow({ track, index, onPlay, isPlaying }: {
  track: AudioTrack; index: number; onPlay: (t: AudioTrack) => void; isPlaying: boolean
}) {
  const cfg = CATEGORY_CONFIG[track.category]
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className={cn('bg-white rounded-2xl border p-3 flex items-center gap-3',
        isPlaying ? 'border-teal-300 bg-teal-50/30' : 'border-pink-100')}>
      <span className="text-xl w-8 text-center">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800 truncate">{track.title}</p>
        <p className="text-xs text-gray-400">{formatDuration(track.duration_seconds)} · {cfg.label}</p>
      </div>
      <button onClick={() => onPlay(track)}
        className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-all',
          isPlaying ? 'bg-teal-500' : 'bg-pink-500 hover:bg-pink-600')}>
        {isPlaying ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white fill-white ml-0.5" />}
      </button>
    </motion.div>
  )
}
