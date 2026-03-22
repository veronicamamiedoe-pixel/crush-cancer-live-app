import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token, email, name } = await request.json()
  if (!email || !token) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: userData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const patientName = userData?.full_name || 'Someone'
  const inviteUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/caregiver/accept/${token}`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Crush Cancer & LIVE <${process.env.RESEND_FROM_EMAIL}>`,
        to: [email],
        subject: `${patientName} has invited you to their Care Squad 💛`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'Nunito', sans-serif; background: #FDFBFB; margin: 0; }
.container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }
.header { background: linear-gradient(135deg, #0D5F60, #1A9EA0); padding: 28px 32px; text-align: center; }
.body { padding: 28px 32px; }
.btn { display: inline-block; background: linear-gradient(135deg, #E8196A, #C4106A); color: #fff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; }
.perm { background: #EAF9F9; border: 1px solid #A8E8E9; border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; font-size: 13px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <p style="color:#FDE8B8;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Crush Cancer &amp; LIVE</p>
    <div style="font-size:40px;margin-bottom:8px;">🦋</div>
    <h1 style="color:#fff;font-size:24px;margin:0;">Care Squad Invitation</h1>
  </div>
  <div class="body">
    <p style="color:#3A4450;font-size:15px;">Hi ${name} 💛</p>
    <p style="color:#6B7A8D;font-size:14px;line-height:1.7;">
      <strong>${patientName}</strong> has invited you to join their Care Squad on Crush Cancer &amp; LIVE.
      This is a beautiful way to support their healing journey.
    </p>
    <p style="color:#6B7A8D;font-size:13px;line-height:1.6;margin-top:16px;">
      As a member of their Care Squad, you can help:
    </p>
    <div class="perm">📅 View and track upcoming appointments</div>
    <div class="perm">💊 Help log medications</div>
    <div class="perm">🏥 Record doctor visit notes</div>
    <div class="perm">📊 Track symptoms</div>
    <div style="text-align:center;margin-top:28px;">
      <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:20px;">
      This invitation expires in 7 days.
    </p>
  </div>
  <div style="padding:16px 32px;text-align:center;color:#9CA3AF;font-size:12px;">
    <p>You are not your diagnosis. You are a Victory in Progress. 🦋</p>
    <p>Crush Cancer &amp; LIVE · Empower · Heal · Thrive</p>
  </div>
</div>
</body>
</html>`,
      }),
    })

    if (!res.ok) throw new Error('Email send failed')
    return NextResponse.json({ sent: true })
  } catch (err: any) {
    console.error('Invite email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
