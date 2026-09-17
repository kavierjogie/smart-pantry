'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { getPantryItems } from '@/lib/db/pantry'
import { getProfile } from '@/lib/db/profile'
import { isExpiringSoon, daysUntilExpiry } from '@/lib/utils'
import type { ChatMessage, PantryItem } from '@/types'
import { cn } from '@/lib/utils'
import { ChatMarkdown } from '@/components/assistant/ChatMarkdown'

const QUICK_PROMPTS = [
  "What can I make with what I have?",
  "Suggest meals using ingredients expiring soon",
  "I want something quick and easy for dinner",
  "What's a good substitute for eggs in baking?",
  "How do I use up leftover chicken?",
  "Give me a healthy lunch idea",
]

function buildPantryContext(items: PantryItem[], profile: { dietary_preferences?: string[]; allergies?: string[] } | null): string {
  if (items.length === 0) return ''

  const expiring = items.filter(i => isExpiringSoon(i.expiry_date))
  const lines = [
    `Pantry (${items.length} items): ${items.slice(0, 30).map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}`,
  ]
  if (expiring.length > 0) {
    lines.push(`Expiring soon: ${expiring.map(i => `${i.name} (${daysUntilExpiry(i.expiry_date)}d)`).join(', ')}`)
  }
  if (profile?.dietary_preferences?.length) {
    lines.push(`Dietary preferences: ${profile.dietary_preferences.join(', ')}`)
  }
  if (profile?.allergies?.length) {
    lines.push(`Allergies: ${profile.allergies.join(', ')}`)
  }
  return lines.join('\n')
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [profile, setProfile] = useState<{ dietary_preferences?: string[]; allergies?: string[] } | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadContext = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [items, prof] = await Promise.all([
      getPantryItems(user.id),
      getProfile(user.id),
    ])
    setPantryItems(items)
    setProfile(prof)
    setDataLoaded(true)
  }, [])

  useEffect(() => { loadContext() }, [loadContext])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const pantryContext = buildPantryContext(pantryItems, profile)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, pantryContext }),
      })

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content || data.error || 'Something went wrong.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function clearChat() {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <Sparkles className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">AI Food Assistant</h1>
            <p className="text-xs text-slate-500">
              {dataLoaded
                ? `Knows about your ${pantryItems.length} pantry items`
                : 'Loading your pantry context…'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="gap-2 text-slate-500">
            <RefreshCw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 mx-auto mb-3">
                <Bot className="h-8 w-8 text-violet-500" />
              </div>
              <h2 className="font-semibold text-slate-800">What would you like to cook?</h2>
              <p className="text-sm text-slate-500 mt-1">
                I can suggest recipes, answer cooking questions, and help you use up ingredients before they expire.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-violet-300 hover:bg-violet-50 transition-colors text-slate-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-violet-100 text-violet-600'
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-sm whitespace-pre-wrap'
                : 'bg-white border text-slate-800 rounded-tl-sm shadow-sm'
            )}>
              {msg.role === 'assistant' ? <ChatMarkdown content={msg.content} /> : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about recipes, substitutions, techniques…"
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Powered by Groq — your pantry context is included automatically · Press Enter to send
        </p>
      </div>
    </div>
  )
}
