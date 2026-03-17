import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const type   = searchParams.get('type')
  const period = searchParams.get('period') || 'today'

  let query = supabase.from('reminders').select('*')
    .eq('user_id', user.id).eq('is_active', true).eq('completed', false)

  if (type) query = query.eq('type', type)

  const now = new Date()
  if (period === 'today') {
    const start = new Date(now); start.setHours(0,0,0,0)
    const end   = new Date(now); end.setHours(23,59,59,999)
    query = query.gte('due_at', start.toISOString()).lte('due_at', end.toISOString())
  } else if (period === 'week') {
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    query = query.gte('due_at', now.toISOString()).lte('due_at', end.toISOString())
  } else if (period === 'overdue') {
    query = query.lt('due_at', now.toISOString())
  }

  const { data, error } = await query.order('due_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminders: data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase.from('reminders')
    .insert({ ...body, user_id: user.id }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminder: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  const { data, error } = await supabase.from('reminders')
    .update(updates).eq('id', id).eq('user_id', user.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminder: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('reminders').update({ is_active: false }).eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
