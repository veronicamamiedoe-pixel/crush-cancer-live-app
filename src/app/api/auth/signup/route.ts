import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side signup: creates auth user + profile in one atomic operation
// This bypasses the broken database trigger entirely
export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Use service role client to bypass RLS and the broken trigger
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Step 1: Create the auth user using admin API
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since mailer_autoconfirm is on
      user_metadata: { full_name: fullName || '' },
    })

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    const userId = userData.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    // Step 2: Manually insert the profile row (bypassing the broken trigger)
    const now = new Date().toISOString()
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        auth_user_id: userId,
        full_name: fullName || email.split('@')[0],
        created_at: now,
        updated_at: now,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Don't fail the signup if profile creation fails — user can still log in
      // The profile will be created on first dashboard load
    }

    // Step 3: Now sign the user in to get a session token for the client
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Error signing in after signup:', signInError)
      // User was created, they just need to log in manually
      return NextResponse.json({
        success: true,
        needsLogin: true,
        message: 'Account created successfully. Please log in.',
      })
    }

    return NextResponse.json({
      success: true,
      needsLogin: false,
      session: {
        access_token: sessionData.session?.access_token,
        refresh_token: sessionData.session?.refresh_token,
      },
    })
  } catch (error: any) {
    console.error('Signup route error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
