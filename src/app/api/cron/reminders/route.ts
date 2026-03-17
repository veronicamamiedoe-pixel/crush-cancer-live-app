// ============================================================
// /api/cron/reminders/route.ts
// Vercel Cron Job — runs every 15 minutes
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "*/15 * * * *" }] }
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Verify this is a Vercel cron request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000) // 15 min ago
  const windowEnd   = new Date(now.getTime() + 15 * 60 * 1000) // 15 min from now

  // Find all active reminders due in this window
  const { data: dueReminders } = await supabase
    .from('reminders')
    .select('*, users!inner(email, full_name, notifications_enabled)')
    .eq('is_active', true)
    .eq('completed', false)
    .gte('due_at', windowStart.toISOString())
    .lte('due_at', windowEnd.toISOString())
    .is('snoozed_until', null)

  if (!dueReminders?.length) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0

  for (const reminder of dueReminders) {
    const user = (reminder as any).users
    if (!user?.notifications_enabled) continue

    try {
      // Send email via Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Crush Cancer & LIVE <${process.env.RESEND_FROM_EMAIL}>`,
          to: [user.email],
          subject: `⏰ Reminder: ${reminder.title}`,
          html: buildReminderEmail(reminder, user.full_name),
        }),
      })

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: reminder.user_id,
        type: 'reminder',
        title: `⏰ ${reminder.title}`,
        message: reminder.description || `Your ${reminder.type.replace('_', ' ')} reminder is due now.`,
        action_url: '/reminders',
      })

      // Handle recurring reminders — create next occurrence
      if (reminder.recurrence !== 'none') {
        await createNextOccurrence(supabase, reminder)
      }

      processed++
    } catch (err) {
      console.error(`Failed to process reminder ${reminder.id}:`, err)
    }
  }

  return NextResponse.json({ processed, total: dueReminders.length })
}

async function createNextOccurrence(supabase: any, reminder: any) {
  const due = new Date(reminder.due_at)
  let nextDue: Date

  switch (reminder.recurrence) {
    case 'daily':
      nextDue = new Date(due.getTime() + 24 * 60 * 60 * 1000)
      break
    case 'twice_daily':
      nextDue = new Date(due.getTime() + 12 * 60 * 60 * 1000)
      break
    case 'weekly':
      nextDue = new Date(due.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'weekdays':
      // Skip to next weekday
      nextDue = new Date(due.getTime() + 24 * 60 * 60 * 1000)
      while (nextDue.getDay() === 0 || nextDue.getDay() === 6) {
        nextDue = new Date(nextDue.getTime() + 24 * 60 * 60 * 1000)
      }
      break
    default:
      return
  }

  await supabase.from('reminders').insert({
    user_id:         reminder.user_id,
    type:            reminder.type,
    title:           reminder.title,
    description:     reminder.description,
    due_at:          nextDue.toISOString(),
    recurrence:      reminder.recurrence,
    priority:        reminder.priority,
    colour:          reminder.colour,
    audio_id:        reminder.audio_id,
    play_audio_after:reminder.play_audio_after,
    linked_entity_id:   reminder.linked_entity_id,
    linked_entity_type: reminder.linked_entity_type,
  })
}

function buildReminderEmail(reminder: any, name: string): string {
  const typeEmoji: Record<string, string> = {
    medication: '💊', appointment: '📅', treatment: '💉', symptom_log: '📊',
    hydration: '💧', nutrition: '🥗', follow_up: '✅', audio_session: '🎵',
    appointment_prep: '📋', custom: '🔔',
  }
  const emoji = typeEmoji[reminder.type] || '🔔'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Nunito', sans-serif; background: #FDFBFB; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0D5F60, #1A9EA0); padding: 28px 32px; text-align: center; }
  .body { padding: 28px 32px; }
  .footer { padding: 16px 32px; text-align: center; color: #9CA3AF; font-size: 12px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #E8196A, #C4106A); color: #fff; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: 700; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <p style="color:#FDE8B8;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;">Crush Cancer &amp; LIVE</p>
    <h1 style="color:#fff;font-size:28px;margin:0;">${emoji} Reminder</h1>
  </div>
  <div class="body">
    <p style="color:#3A4450;font-size:15px;">Hi ${name || 'there'} 💛</p>
    <h2 style="color:#1E2832;font-size:20px;margin:12px 0 6px;">${reminder.title}</h2>
    ${reminder.description ? `<p style="color:#6B7A8D;font-size:14px;">${reminder.description}</p>` : ''}
    <p style="color:#6B7A8D;font-size:13px;margin-top:8px;">
      Due: <strong style="color:#E8196A;">${new Date(reminder.due_at).toLocaleString('en-GB', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}</strong>
    </p>
    ${reminder.play_audio_after ? '<p style="color:#1A9EA0;font-size:13px;font-weight:700;">🎵 Your audio session is ready to play after this reminder.</p>' : ''}
    <div style="margin-top:24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reminders" class="btn">View &amp; Complete</a>
    </div>
  </div>
  <div class="footer">
    <p>You are not your diagnosis. You are a Victory in Progress. 🦋</p>
    <p style="margin-top:4px;">Crush Cancer &amp; LIVE · <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#1A9EA0;">Manage notifications</a></p>
  </div>
</div>
</body>
</html>`
}
