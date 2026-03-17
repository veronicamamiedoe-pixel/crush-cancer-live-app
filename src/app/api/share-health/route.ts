import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { report_type, title, date_range_from, date_range_to, included_sections } = await request.json()

  // Gather relevant data based on included sections
  const reportData: Record<string, unknown> = {}

  if (included_sections.symptoms) {
    const { data } = await supabase.from('symptom_logs').select('*').eq('user_id', user.id)
      .gte('logged_at', date_range_from || new Date(Date.now() - 30*24*60*60*1000).toISOString())
      .order('logged_at', { ascending: false })
    reportData.symptoms = data
  }
  if (included_sections.appointments) {
    const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(10)
    reportData.appointments = data
  }
  if (included_sections.medications) {
    const { data } = await supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true)
    reportData.medications = data
  }
  if (included_sections.treatments) {
    const { data } = await supabase.from('treatment_sessions').select('*').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(20)
    reportData.treatments = data
  }

  const { data: report, error } = await supabase.from('shared_reports').insert({
    user_id: user.id,
    title,
    report_type,
    date_range_from,
    date_range_to,
    included_sections,
    report_data: reportData,
    is_active: true,
    token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ shareToken: report.share_token, report })
}

// GET: view a shared report by token (public route)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const supabase = createClient()
  const { data } = await supabase.from('shared_reports')
    .select('*').eq('share_token', token).eq('is_active', true).single()

  if (!data) return NextResponse.json({ error: 'Report not found or expired' }, { status: 404 })

  // Increment view count
  await supabase.from('shared_reports').update({
    view_count: data.view_count + 1,
    last_viewed_at: new Date().toISOString(),
  }).eq('id', data.id)

  return NextResponse.json({ report: data })
}
