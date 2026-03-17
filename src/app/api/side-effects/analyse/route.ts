// ============================================================
// /api/side-effects/analyse/route.ts
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyseSideEffectPatterns } from '@/lib/ai/sideEffectIntelligence'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single()
  if (!sub || sub.plan !== 'premium') {
    return NextResponse.json({ error: 'Premium plan required', upgradeRequired: true }, { status: 403 })
  }

  try {
    const patterns = await analyseSideEffectPatterns(user.id)
    return NextResponse.json({ count: patterns.length, patterns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
