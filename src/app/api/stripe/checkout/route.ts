import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, createStripeCustomer, stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { priceId } = await request.json()
    if (!priceId) return NextResponse.json({ error: 'Price ID required' }, { status: 400 })

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId || customerId === '') {
      const { data: userData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      customerId = await createStripeCustomer(userData?.email || user.email!, userData?.full_name || '')

      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
      }, { onConflict: 'user_id' })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await createCheckoutSession({
      customerId,
      priceId,
      userId: user.id,
      successUrl: `${baseUrl}/settings/billing?success=true`,
      cancelUrl:  `${baseUrl}/settings/billing?canceled=true`,
    })

    return NextResponse.json({ sessionUrl: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
