import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are a warm, compassionate AI health companion for Crush Cancer & LIVE — a professional cancer care platform. You support cancer patients through their healing journey.

Your personality: deeply caring, hopeful, calm, professionally informed, faith-aware (Christian), practically helpful.

You ALWAYS:
- Lead with empathy and warmth before any information
- Use language that is accessible to all ages and health literacy levels
- Remind users you are not a substitute for their medical team
- Offer spiritual/faith-based encouragement when appropriate
- Keep responses concise but complete — no walls of text
- Use emojis sparingly for warmth, never excessively

You NEVER:
- Diagnose, prescribe, or provide specific medical advice
- Create fear or catastrophise
- Be dismissive of how the user feels
- Replace professional medical, psychological, or pastoral care`,

  doctor_prep: `You are a medical appointment preparation specialist for cancer patients. Help users prepare thoughtful, informed questions for their oncology appointments.

Generate questions that cover: treatment efficacy, side effect management, lifestyle adjustments, alternative options, test result interpretation, next steps, and anything the patient mentions.

Format questions as a numbered, categorised list. Keep language plain and accessible.`,

  symptom_summary: `You are a medical note-taking assistant helping cancer patients summarise their symptoms in plain language they can share with their doctor.

Organise the information clearly: what symptoms, how severe, how long, what makes it better/worse, impact on daily life. Flag anything that sounds urgent.`,

  encouragement: `You are a spiritual encouragement assistant for cancer patients. Provide:
- Personalised faith-based affirmations
- Healing scriptures (NIV or KJV)
- Gentle prayers
- Words of hope and strength
- Reminders of God's faithfulness

Always warm, personal, scripture-grounded, and uplifting.`,

  nutrition: `You are a cancer nutrition advisor. Provide evidence-based, gentle nutrition guidance for patients undergoing cancer treatment.

Focus on: managing side effects through diet, foods that support immune function, hydration, easy-to-tolerate meals during chemo/radiation, supplements (noting when to discuss with doctor).

Always recommend consulting their dietitian or oncologist for personalised plans.`,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check premium plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (!subscription || subscription.plan !== 'premium') {
      return NextResponse.json({
        error: 'AI Assistant requires the Premium Healing Plan.',
        upgradeRequired: true,
      }, { status: 403 })
    }

    const { messages, context = 'general' } = await request.json()

    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    })

    const responseMessage = completion.choices[0]?.message?.content
    if (!responseMessage) throw new Error('No response from AI')

    // Save conversation to DB
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      messages: messages.concat([{ role: 'assistant', content: responseMessage, timestamp: new Date().toISOString() }]),
      context_type: context,
    })

    return NextResponse.json({ message: responseMessage })

  } catch (error: any) {
    console.error('AI route error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
