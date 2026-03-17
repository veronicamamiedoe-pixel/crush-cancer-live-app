'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, ChevronRight, Heart, Leaf, Zap, Users, HelpCircle, Apple } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'treatment',  label: 'Understanding Treatment', emoji: '💊', icon: Zap,        colour: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200'    },
  { value: 'nutrition',  label: 'Nutrition & Diet',        emoji: '🥗', icon: Apple,      colour: 'text-green-600',  bg: 'bg-green-50 border-green-200'  },
  { value: 'wellness',   label: 'Wellness & Lifestyle',    emoji: '🌿', icon: Leaf,       colour: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200'    },
  { value: 'spiritual',  label: 'Faith & Spiritual',       emoji: '🙏', icon: Heart,      colour: 'text-purple-600', bg: 'bg-purple-50 border-purple-200'},
  { value: 'support',    label: 'Support & Resources',     emoji: '🤝', icon: Users,      colour: 'text-gold-600',   bg: 'bg-gold-50 border-gold-200'    },
  { value: 'caregiver',  label: 'For Caregivers',          emoji: '💛', icon: Users,      colour: 'text-rose-600',   bg: 'bg-rose-50 border-rose-200'    },
]

// Static library content — in production this would come from the DB
const ARTICLES = [
  {
    id: '1', category: 'treatment', title: 'Understanding Chemotherapy',
    summary: 'How chemotherapy works, what to expect during treatment, and how to manage common side effects.',
    readTime: '5 min', tags: ['chemo','treatment','basics'],
    content: `Chemotherapy uses powerful drugs to destroy cancer cells or stop them from growing and dividing. While it targets cancer cells, it can also affect healthy cells, which is why side effects occur.

**How It Works**
Chemotherapy drugs work in different ways — some interrupt cancer cell division, others damage the DNA of cancer cells. Many treatment plans combine multiple drugs for greater effectiveness.

**What to Expect**
Treatment cycles typically involve periods of treatment followed by rest periods, allowing your body to recover. Sessions can take anywhere from 30 minutes to several hours depending on your protocol.

**Common Side Effects**
• Fatigue — one of the most common effects; rest is essential
• Nausea — anti-emetic medications help manage this significantly  
• Hair loss — usually temporary; hair grows back after treatment
• Appetite changes — eating small, frequent meals can help
• Increased infection risk — your immune system needs extra protection

**Important Reminder**
Always communicate every symptom and concern to your oncology team. They are there to support you through this. Never stop or change your medication without medical guidance.`,
  },
  {
    id: '2', category: 'treatment', title: 'Radiation Therapy Explained',
    summary: 'What radiation therapy involves, how it works, and how to care for your skin during treatment.',
    readTime: '4 min', tags: ['radiation','treatment','skin care'],
    content: `Radiation therapy uses high-energy rays or particles to destroy cancer cells. It is precise, targeting specific areas of the body while minimising damage to surrounding tissue.

**Types of Radiation**
External beam radiation is the most common, using a machine outside the body. Internal radiation (brachytherapy) places radioactive material inside or near the tumour.

**Skin Care During Radiation**
Radiation to the skin area can cause redness, soreness, and peeling. Your team will recommend gentle, unscented products. Avoid direct sun on treated areas.

**Fatigue Management**
Fatigue builds over the course of treatment. Gentle exercise, rest, and good nutrition help. Listen to your body — rest when you need to.`,
  },
  {
    id: '3', category: 'nutrition', title: 'Eating Well During Chemotherapy',
    summary: 'Foods that support your body, gentle options for difficult days, and how to stay nourished.',
    readTime: '6 min', tags: ['nutrition','chemo','wellness'],
    content: `Good nutrition during cancer treatment supports your immune system, helps your body repair itself, and can reduce treatment side effects. Here is practical guidance for eating well.

**When Appetite Is Low**
Eat small amounts frequently — every 2–3 hours rather than large meals. Cold or room-temperature foods are often better tolerated than hot foods. Smoothies, soups, and soft foods are gentle options.

**Foods That Support Healing**
• Lean proteins: chicken, fish, eggs, lentils, tofu — support tissue repair
• Colourful vegetables: antioxidants support your immune system
• Whole grains: provide sustained energy
• Ginger and peppermint: naturally help with nausea
• Probiotic foods: yogurt, kefir — support gut health

**Foods to Be Cautious With**
Raw or undercooked meat, fish, and eggs carry infection risk when your immunity is low. Discuss alcohol and grapefruit with your team as these may interact with medications.

**Staying Hydrated**
Aim for 8–10 glasses of fluid daily. Water, herbal teas, and diluted juices count. If nausea is severe, sip small amounts regularly rather than large amounts at once.

**When to Ask for Help**
If you are losing significant weight, struggling to eat, or have persistent nausea, ask your oncology team for a referral to an oncology dietitian. Nutritional support is part of your care.`,
  },
  {
    id: '4', category: 'wellness', title: 'Managing Treatment Fatigue',
    summary: 'Why cancer-related fatigue happens and evidence-based strategies to manage it effectively.',
    readTime: '5 min', tags: ['fatigue','wellness','energy'],
    content: `Cancer-related fatigue is one of the most common and most under-reported symptoms in cancer patients. It is different from ordinary tiredness — it does not always improve with rest.

**Why It Happens**
Fatigue can be caused by the cancer itself, treatment side effects, anaemia, poor sleep, depression, poor nutrition, or a combination of factors.

**Energy Conservation**
• Prioritise your most important activities for when your energy is highest
• Accept help — delegate tasks to family, friends, and your care squad
• Plan rest periods before and after demanding activities
• Pace yourself; do not push through extreme exhaustion

**Gentle Movement**
Counterintuitively, gentle exercise often reduces fatigue. Short walks, gentle stretching, or yoga can improve energy levels. Start very gently and listen to your body.

**Sleep Hygiene**
Create a consistent sleep schedule, keep your bedroom cool and dark, limit screens before bed, and try the bedtime meditation audio in the Guided Audio section.

**Talk to Your Team**
Fatigue can be a symptom of anaemia or other treatable conditions. Always report significant fatigue to your oncologist.`,
  },
  {
    id: '5', category: 'spiritual', title: 'Finding Peace in the Storm',
    summary: 'How faith, prayer, and spiritual practice support healing — honouring the whole person.',
    readTime: '4 min', tags: ['faith','peace','spiritual','prayer'],
    content: `A cancer diagnosis can shake the foundations of your world. Many patients find that their faith and spiritual life becomes a profound source of strength, comfort, and resilience during this time.

**You Are Not Alone**
The Psalms are filled with laments — honest cries to God from people in deep pain. Your struggle is not a sign of weak faith. God meets us in our suffering.

**The Power of Declaration**
Speaking words of faith aloud — declarations of healing, of God's goodness, of His promises — is a practice that many patients find sustains their hope during difficult days.

**Prayer as Conversation**
Prayer does not require special words or performances. Talk to God honestly about your fears, your hopes, and your needs. He hears every word.

**Community and Support**
Being part of a faith community provides practical support, prayer, and a sense of belonging. If you are not connected to one, your pastoral care team can help.

**Journalling Your Faith Journey**
Use the Journal section to write your prayers, record answered prayers, and document moments of grace. These become a powerful testimony over time.`,
  },
  {
    id: '6', category: 'support', title: 'Talking to Your Family About Cancer',
    summary: 'Practical guidance for difficult conversations — with your partner, children, and wider family.',
    readTime: '5 min', tags: ['family','communication','support'],
    content: `One of the hardest parts of a cancer diagnosis is knowing how to tell the people you love. There is no perfect script, but there are approaches that tend to work well.

**Telling Your Partner**
Choose a calm, private moment. Share your feelings as well as the facts. Let them respond without trying to manage their emotions. Make it clear how you want them to support you.

**Talking to Children**
Children of all ages sense when something is wrong — honesty, at an age-appropriate level, is almost always better than secrecy. Use simple, clear language. Reassure them they are loved and that nothing is their fault.

**Setting Boundaries**
You are not obligated to share every detail with everyone. Decide what you are comfortable sharing and with whom. Designate one trusted person to communicate updates to the wider family if that helps.

**Using the Care Squad Feature**
The Care Squad feature in this app is designed to help you coordinate with your support circle — letting people know what you need, when, and how to help.

**Getting Support Yourself**
Many cancer centres offer counselling for patients and families. Your GP can also refer you to mental health support. You do not have to carry this alone.`,
  },
  {
    id: '7', category: 'caregiver', title: 'A Guide for Caregivers',
    summary: 'Looking after yourself while caring for someone with cancer. You matter too.',
    readTime: '6 min', tags: ['caregiver','family','self-care'],
    content: `Caring for someone with cancer is one of the most loving things a person can do — and one of the most demanding. This guide is for you.

**You Cannot Pour From an Empty Cup**
Your wellbeing is not a luxury — it is essential to sustainable caring. Neglecting your own health, sleep, and emotional needs ultimately reduces the care you can give.

**Practical Tips**
• Accept help when it is offered — say yes rather than 'we're fine'
• Use the Care Squad feature to organise and delegate tasks
• Keep a basic routine for yourself even when everything feels chaotic
• Stay connected to friends, your faith community, and your own life

**Emotional Health**
Caregiver grief, anxiety, and burnout are real and common. Speaking to a counsellor who understands caregiving is enormously helpful. Your GP is a good first step.

**Staying Informed**
Use the Doctor Visits recorder to help keep track of appointments, action items, and medical decisions. Being informed helps you feel more in control.

**Setting Boundaries**
It is okay not to be available 24/7. Rest, nights away, and time for yourself are not selfish — they are necessary. Sustainable caring requires periods of rest.

**You Are Loved Too**
The person you are caring for needs you to look after yourself. Let that be permission enough.`,
  },
]

export default function LibraryPage() {
  const [search, setSearch]         = useState('')
  const [activeCategory, setCategory] = useState('all')
  const [selectedArticle, setSelected] = useState<typeof ARTICLES[0] | null>(null)

  const filtered = ARTICLES.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  if (selectedArticle) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto animate-fade-in">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 mb-6 font-semibold transition-colors">
            ← Back to Library
          </button>
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-pink capitalize">{selectedArticle.category.replace('_', ' ')}</span>
              <span className="text-xs text-gray-400">· {selectedArticle.readTime} read</span>
            </div>
            <h1 className="font-display text-3xl text-gray-900 mb-4">{selectedArticle.title}</h1>
            <p className="text-gray-500 font-light leading-relaxed mb-6 border-b border-gray-100 pb-5">{selectedArticle.summary}</p>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {selectedArticle.content.split('\n\n').map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return <h3 key={i} className="font-bold text-gray-800 text-base mt-5 mb-2">{para.slice(2,-2)}</h3>
                }
                if (para.startsWith('• ') || para.includes('\n• ')) {
                  return (
                    <ul key={i} className="list-none space-y-1 my-2">
                      {para.split('\n').map((line, j) => line.startsWith('• ') ? (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-pink-400 mt-1">•</span>
                          <span>{line.slice(2)}</span>
                        </li>
                      ) : null)}
                    </ul>
                  )
                }
                return <p key={i} className="text-sm leading-relaxed mb-3">{para}</p>
              })}
            </div>
            <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
              <p className="text-xs text-teal-700 font-semibold">
                📌 This article is for educational purposes only. Always follow the guidance of your medical team.
                For personalised advice, speak with your oncologist, GP, or relevant specialist.
              </p>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {selectedArticle.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <p className="sec-eyebrow">Learn · Understand · Empower</p>
          <h2 className="font-display text-4xl text-gray-900">
            Knowledge <span className="text-teal-500">Library</span>
          </h2>
          <p className="sec-intro">
            Clear, compassionate articles on treatment, nutrition, wellness, faith, and caregiving.
            Written for patients and families, not medical professionals.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="ccl-input pl-11" placeholder="Search articles..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button onClick={() => setCategory('all')}
            className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
              activeCategory === 'all' ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-200')}>
            <BookOpen className={cn('w-6 h-6', activeCategory === 'all' ? 'text-teal-600' : 'text-gray-400')} />
            <span className="text-xs font-bold text-center leading-tight">All Articles</span>
          </button>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.value
            return (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                  isActive ? `border-current ${cat.bg}` : 'border-gray-200 bg-white hover:border-gray-300')}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className={cn('text-xs font-bold text-center leading-tight', isActive ? cat.colour : 'text-gray-500')}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Articles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((article, i) => {
            const cat = CATEGORIES.find(c => c.value === article.category) || CATEGORIES[0]
            return (
              <motion.div key={article.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('bg-white rounded-2xl border-2 p-5 cursor-pointer group hover:shadow-card transition-all', cat.bg)}
                onClick={() => setSelected(article)}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs text-gray-400 font-semibold">{article.readTime}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-2 group-hover:text-pink-600 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">{article.summary}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                  Read article <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="font-semibold text-gray-500">No articles found</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
          All articles are for educational purposes only and do not constitute medical advice.
          Always follow your medical team's guidance for your specific situation.
        </p>
      </div>
    </AppShell>
  )
}
