import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVisitSummary } from '@/lib/ai/sideEffectIntelligence'

// GET all visits
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('doctor_visits').select('*')
    .eq('user_id', user.id).order('visit_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ visits: data })
}

// POST new visit
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { generateAI, ...visitData } = body

  const { data: visit, error } = await supabase.from('doctor_visits')
    .insert({ ...visitData, user_id: user.id }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate AI summary if requested (premium feature)
  if (generateAI) {
    const { data: sub } = await supabase.from('subscriptions')
      .select('plan').eq('user_id', user.id).single()

    if (sub?.plan === 'premium') {
      const aiResult = await generateVisitSummary(visitData)
      if (aiResult?.summary) {
        await supabase.from('doctor_visits').update({
          ai_summary:      aiResult.summary,
          ai_action_items: aiResult.action_items || [],
          ai_questions:    aiResult.questions || [],
        }).eq('id', visit.id)

        // Create action items in reminders table
        if (aiResult.action_items?.length) {
          await supabase.from('reminders').insert(
            aiResult.action_items.map((item: any) => ({
              visit_id:  visit.id,
              user_id:   user.id,
              title:     item.title,
              is_urgent: item.is_urgent || false,
            }))
          )
        }

        // Create reminder for follow-up if next appointment date set
        if (visitData.next_appointment_date) {
          await supabase.from('reminders').insert({
            user_id:     user.id,
            type:        'appointment_prep',
            title:       `Prepare for appointment on ${visitData.next_appointment_date}`,
            description: 'Review your briefing and prepare questions',
            due_at:      new Date(new Date(visitData.next_appointment_date).getTime() - 24*60*60*1000).toISOString(),
            priority:    'high',
          })
        }
      }
    }
  }

  return NextResponse.json({ visit })
}
