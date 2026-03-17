'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, RefreshCw, Copy, Check } from 'lucide-react'
import { AppShell } from '@/components/shared/AppShell'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CONTEXT_MODES = [
  { id: 'general',        label: 'General Support',     emoji: '💬', description: 'Chat freely — get encouragement, answers, and support' },
  { id: 'doctor_prep',    label: 'Doctor Visit Prep',   emoji: '🩺', description: 'Generate smart questions to ask your oncologist' },
  { id: 'symptom_summary',label: 'Symptom Summary',     emoji: '📊', description: 'Summarise your recent symptoms in plain English' },
  { id: 'encouragement',  label: 'Daily Encouragement', emoji: '💛', description: 'Receive personalised affirmations and faith declarations' },
  { id: 'nutrition',      label: 'Nutrition Guidance',  emoji: '🥗', description: 'Get eating tips tailored to your treatment phase' },
]

const QUICK_PROMPTS = [
  "What questions should I ask at my next chemo appointment?",
  "Help me understand what my blood test results might mean",
  "I'm feeling anxious today. Can you help me feel calmer?",
  "What foods are gentle on the stomach during chemotherapy?",
  "Write a prayer for healing and peace for me today",
  "Give me 5 affirmations to speak over myself right now",
  "What side effects should I report to my doctor immediately?",
  "How can I explain my diagnosis to my children?",
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mode, setMode]         = useState('general')
  const [copied, setCopied]     = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Welcome message on mount
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hello, warrior! 💛 I'm your Crush Cancer & LIVE AI Assistant. I'm here to support you through your healing journey.\n\nI can help you:\n• **Prepare for doctor appointments** — generate smart questions\n• **Understand your symptoms** — summarise what you're experiencing\n• **Stay emotionally strong** — affirmations, prayers, encouragement\n• **Navigate nutrition** — eating tips during treatment\n• **Answer health questions** — in plain, caring language\n\nWhat can I help you with today? Remember, I'm not a replacement for your medical team — but I'm always here to support and empower you. 🦋`,
      timestamp: new Date(),
    }])
  }, [])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = { role: 'user', content: messageText, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          context: mode,
        }),
      })

      if (!response.ok) throw new Error('Request failed')

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }])
    } catch {
      toast.error('Could not reach AI assistant. Please try again.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I couldn't respond right now. Please try again in a moment. You're not alone — your Care Squad and medical team are always there for you. 💛",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copied to clipboard')
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Starting fresh! 💛 How can I support you today?",
      timestamp: new Date(),
    }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <AppShell>
      <div className="space-y-4 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="sec-eyebrow">Premium Feature</p>
              <span className="badge-gold">✨ AI Powered</span>
            </div>
            <h2 className="font-display text-4xl text-gray-900">AI <span className="text-pink-500">Assistant</span></h2>
            <p className="sec-intro">Your personal health companion — always here, always caring.</p>
          </div>
          <button onClick={clearChat} className="btn-outline flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CONTEXT_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex flex-col gap-1 p-3 rounded-2xl border-2 text-left transition-all duration-150',
                mode === m.id
                  ? 'border-pink-500 bg-pink-50 shadow-pink'
                  : 'border-pink-100 bg-white hover:border-pink-300'
              )}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-xs font-bold text-gray-700 leading-tight">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Chat window */}
          <div className="lg:col-span-3 ccl-card flex flex-col" style={{ height: '60vh' }}>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold',
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-pink-400 to-pink-600 text-white'
                    )}>
                      {msg.role === 'assistant' ? '🤖' : '👤'}
                    </div>

                    {/* Bubble */}
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'assistant'
                        ? 'bg-white border border-pink-100 text-gray-800'
                        : 'bg-gradient-to-br from-pink-500 to-pink-600 text-white'
                    )}>
                      <MessageContent content={msg.content} isUser={msg.role === 'user'} />
                      <div className={cn(
                        'flex items-center justify-between mt-1.5 gap-4',
                        msg.role === 'user' ? 'flex-row-reverse' : ''
                      )}>
                        <span className={cn('text-xs', msg.role === 'user' ? 'text-pink-200' : 'text-gray-400')}>
                          {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => copyMessage(msg.content, String(i))}
                            className="text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            {copied === String(i) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-sm">🤖</div>
                  <div className="bg-white border border-pink-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1 items-center h-5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-pink-100 p-4">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything — your health, your treatment, how you feel..."
                  rows={2}
                  className="flex-1 ccl-textarea resize-none min-h-0 py-2.5"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="btn-primary flex-shrink-0 aspect-square p-3"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <Sparkles className="w-3 h-3 inline mr-1 text-gold-400" />
                AI responses are supportive guidance only — always follow your medical team's advice.
              </p>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-700 px-1">💡 Quick Prompts</h3>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left p-3 rounded-2xl border border-pink-100 bg-white hover:border-pink-300 hover:bg-pink-50 transition-all text-xs font-semibold text-gray-700 leading-snug"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}

// Render markdown-lite formatting
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const parts = content.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold mt-2 mb-0.5">{line.slice(2, -2)}</p>
    }
    if (line.startsWith('• ')) {
      return <p key={i} className="ml-2">• {line.slice(2)}</p>
    }
    if (line === '') return <br key={i} />
    // Bold inline
    const boldParts = line.split(/\*\*(.*?)\*\*/g)
    if (boldParts.length > 1) {
      return <p key={i}>{boldParts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>
    }
    return <p key={i}>{line}</p>
  })
  return <div className="space-y-0.5">{parts}</div>
}
