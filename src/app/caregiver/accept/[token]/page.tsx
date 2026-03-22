import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface AcceptPageProps {
  params: { token: string }
}

export default async function AcceptInvitePage({ params }: AcceptPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invite } = await supabase.from('caregiver_access')
    .select('*, users!patient_id(full_name)')
    .eq('invite_token', params.token)
    .eq('invite_accepted', false)
    .single()

  if (!invite || new Date(invite.invite_expires_at) < new Date()) {
    notFound()
  }

  const patient = (invite as any).users

  if (user) {
    // Accept the invite
    await supabase.from('caregiver_access').update({
      caregiver_id: user.id,
      invite_accepted: true,
      invite_accepted_at: new Date().toISOString(),
    }).eq('invite_token', params.token)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-teal-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🦋</div>
        <h1 className="font-bold text-3xl text-gray-900 mb-2">Care Squad Invitation</h1>
        <p className="text-gray-600 mb-6">
          <strong>{patient?.full_name || 'Someone'}</strong> has invited you to join their Care Squad
          on Crush Cancer &amp; LIVE and help support their healing journey.
        </p>

        {user ? (
          <div>
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-6">
              <p className="font-bold text-teal-700">✅ Invitation Accepted!</p>
              <p className="text-sm text-teal-600 mt-1">
                You now have access to help support {patient?.full_name}.
              </p>
            </div>
            <a href="/dashboard" className="btn-teal w-full justify-center block py-3 text-center rounded-full bg-gradient-to-r from-teal-500 to-teal-700 text-white font-bold">
              Go to Dashboard →
            </a>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-5">Sign in or create a free account to accept this invitation.</p>
            <div className="space-y-3">
              <a href={`/auth/signup?invite=${params.token}`}
                className="block w-full py-3 text-center rounded-full bg-gradient-to-r from-pink-500 to-pink-700 text-white font-bold hover:shadow-lg transition-all">
                Create Free Account
              </a>
              <a href={`/auth/login?invite=${params.token}`}
                className="block w-full py-3 text-center rounded-full border-2 border-pink-200 text-pink-600 font-bold hover:bg-pink-50 transition-all">
                Sign In
              </a>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Crush Cancer &amp; LIVE · Empower · Heal · Thrive 🦋
        </p>
      </div>
    </div>
  )
}
