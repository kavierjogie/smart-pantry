import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GROQ_MODEL = 'openai/gpt-oss-120b'
const GROQ_TIMEOUT_MS = 30_000

type ChatInputMessage = {
  role: 'user' | 'assistant'
  content: string
}

function isChatInputMessage(value: unknown): value is ChatInputMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  )
}

function getMessageContent(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const message = value as { choices?: unknown }
  if (!Array.isArray(message.choices) || message.choices.length === 0) return null

  const choice = message.choices[0]
  if (!choice || typeof choice !== 'object') return null
  const responseMessage = (choice as { message?: unknown }).message
  if (!responseMessage || typeof responseMessage !== 'object') return null

  const content = (responseMessage as { content?: unknown }).content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return null

  const text = content
    .filter((part): part is { text: string } => (
      !!part &&
      typeof part === 'object' &&
      typeof (part as { text?: unknown }).text === 'string'
    ))
    .map((part) => part.text)
    .join('')

  return text || null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const messages = Array.isArray(body?.messages)
      ? body.messages.filter(isChatInputMessage)
      : []
    const pantryContext = typeof body?.pantryContext === 'string'
      ? body.pantryContext.trim()
      : ''

    if (messages.length === 0) {
      return NextResponse.json({ error: 'At least one chat message is required.' }, { status: 400 })
    }

    const systemPrompt = `You are a knowledgeable, friendly personal food assistant for Smart Pantry, a food management app. You talk like a helpful person who knows this user's kitchen, not like a generic recipe article.

Your role:
- Help users decide what to cook based on their available ingredients
- Suggest ingredient substitutions when something is missing
- Answer cooking questions with clear, practical advice
- Suggest recipes that minimize food waste
- Help with dietary restrictions and allergies
- Explain cooking techniques in accessible language
- Suggest what to cook with ingredients close to expiry

${pantryContext ? `Current pantry context:
${pantryContext}

Personalization rules:
- Ground your answer in the pantry items, expiry dates, dietary preferences, and allergies above. Never invent items, dates, preferences, or nutrition facts that aren't listed.
- When the user asks about ingredients, recipes, or substitutes, prioritize what they already have in the pantry before suggesting something they'd need to buy.
- Mention items that are expiring soon only when they're actually relevant to the question — don't force it in.
- Always respect the listed dietary preferences and allergies in every recommendation; never suggest something that conflicts with them.
- Only bring up pantry, expiry, or dietary details that are relevant to the current question. Don't mention personal info just because you have it.
- State each piece of pantry/dietary/expiry information at most once per response — don't repeat it in an intro and then again in the body.` : 'No pantry context is available right now, so answer from general culinary knowledge and don\'t claim to know the user\'s ingredients or preferences.'}

Response style:
- Lead with the actual answer or recommendation in the first sentence or two. Do not open with a preamble, disclaimer, or restatement of the question.
- Keep answers concise and scannable. Use short bullet points instead of long paragraphs or tables, unless a table is genuinely the clearest way to show the information (e.g. comparing several options side by side).
- When suggesting a substitution, give a practical quantity (e.g. "¼ cup / 60g per egg") and brief instructions for how to use it.
- Briefly explain *why* a suggestion fits the user's situation (what they have, what they can't eat, what's about to expire) when that reasoning adds value — but keep it to one short clause, not a separate paragraph.
- Skip generic disclaimers and filler encouragement. Be warm but efficient.`

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'AI assistant is not configured. Please add GROQ_API_KEY to environment variables.' },
        { status: 503 }
      )
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      let details: { error?: { code?: string; message?: string } } | null = null
      try {
        details = JSON.parse(err)
      } catch {
        // Keep the upstream response out of the client if it is not JSON.
      }
      console.error('Groq API error:', {
        status: response.status,
        code: details?.error?.code,
        message: details?.error?.message,
      })
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    const data: unknown = await response.json()
    const content = getMessageContent(data)
    if (!content) {
      console.error('Groq API returned an unexpected response shape')
      return NextResponse.json(
        { error: 'AI service returned an invalid response. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ content })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'AI service took too long to respond. Please try again.' },
        { status: 504 }
      )
    }
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
