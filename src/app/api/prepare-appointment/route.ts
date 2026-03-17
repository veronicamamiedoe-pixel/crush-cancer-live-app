import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAppointmentBriefing } from '@/lib/ai/sideEffectIntelligence'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single()
  if (!sub || sub.plan !== 'premium') {
    return NextResponse.json({ error: 'Premium plan required', upgradeRequired: true }, { status: 403 })
  }

  const { appointmentId } = await request.json()

  try {
    const result = await generateAppointmentBriefing(user.id, appointmentId)
    if (!result) return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

    // Fetch the saved briefing
    const { data: briefing } = await supabase
      .from('appointment_briefings').select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1).single()

    return NextResponse.json({ briefing, ai: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
